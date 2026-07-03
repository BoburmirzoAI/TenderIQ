"""Admin AI models — prediction history and usage statistics."""

import logging
from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.utils import escape_like as _esc
from app.models.companies.bid import Bid
from app.models.tenders.tender import Tender
from app.models.tenders.tender_match import TenderMatch
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class AIStats(BaseModel):
    total_predictions: int
    predictions_with_ml: int
    total_matches: int
    avg_match_score: float
    tenders_with_amount: int


class PredictionItem(BaseModel):
    id: int
    user_id: int
    user_email: Optional[str] = None
    tender_id: int
    tender_title: Optional[str] = None
    amount: float
    predicted_amount: Optional[float] = None
    confidence: Optional[float] = None
    status: str
    created_at: str


class DailyUsage(BaseModel):
    day: str
    count: int


class TopUser(BaseModel):
    user_id: int
    email: str
    count: int


class PriceEstimate(BaseModel):
    category: str
    region: str
    amount_min_mln: float
    amount_max_mln: float
    confidence: float
    sample_count: int
    avg_tender_amount_mln: Optional[float] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=SuccessResponse[AIStats])
async def ai_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Overview stats for AI model activity."""
    total_bids = (await db.execute(select(func.count(Bid.id)))).scalar_one()
    ml_bids = (await db.execute(
        select(func.count(Bid.id)).where(Bid.predicted_amount.isnot(None))
    )).scalar_one()
    total_matches = (await db.execute(select(func.count(TenderMatch.id)))).scalar_one()
    avg_score_row = (await db.execute(select(func.avg(TenderMatch.score)))).scalar_one()
    tenders_with_amount = (await db.execute(
        select(func.count(Tender.id)).where(Tender.amount.isnot(None))
    )).scalar_one()

    return SuccessResponse(data=AIStats(
        total_predictions=total_bids,
        predictions_with_ml=ml_bids,
        total_matches=total_matches,
        avg_match_score=round(float(avg_score_row or 0), 3),
        tenders_with_amount=tenders_with_amount,
    ))


@router.get("/predictions", response_model=SuccessResponse[List[PredictionItem]])
async def list_predictions(
    limit: int = 50,
    status: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List recent bids that include ML price predictions."""
    query = (
        select(Bid, User.email, Tender.title)
        .join(User, User.id == Bid.user_id, isouter=True)
        .join(Tender, Tender.id == Bid.tender_id, isouter=True)
        .order_by(Bid.created_at.desc())
        .limit(limit)
    )
    if status:
        query = query.where(Bid.status == status)

    rows = (await db.execute(query)).all()
    items = []
    for bid, email, title in rows:
        items.append(PredictionItem(
            id=bid.id,
            user_id=bid.user_id,
            user_email=email,
            tender_id=bid.tender_id,
            tender_title=title,
            amount=bid.amount,
            predicted_amount=bid.predicted_amount,
            confidence=bid.confidence,
            status=bid.status,
            created_at=str(bid.created_at),
        ))
    return SuccessResponse(data=items)


@router.get("/usage/daily", response_model=SuccessResponse[List[DailyUsage]])
async def daily_usage(
    days: int = 7,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Count predictions per day for the last N days (from bids)."""
    result = []
    for i in range(days - 1, -1, -1):
        d = date.today() - timedelta(days=i)
        count = (await db.execute(
            select(func.count(Bid.id)).where(
                func.date(Bid.created_at) == d
            )
        )).scalar_one()
        result.append(DailyUsage(day=d.strftime("%d-%b"), count=count))
    return SuccessResponse(data=result)


@router.get("/usage/top-users", response_model=SuccessResponse[List[TopUser]])
async def top_users(
    limit: int = 10,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Top users by prediction (bid) count."""
    rows = (await db.execute(
        select(User.id, User.email, func.count(Bid.id).label("cnt"))
        .join(Bid, Bid.user_id == User.id)
        .group_by(User.id, User.email)
        .order_by(func.count(Bid.id).desc())
        .limit(limit)
    )).all()
    return SuccessResponse(data=[
        TopUser(user_id=r.id, email=r.email, count=r.cnt) for r in rows
    ])


@router.post("/predict/price", response_model=SuccessResponse[PriceEstimate])
async def predict_price(
    data: dict,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Estimate price range from historical tender data.
    Body: { category, region, amount_min_mln, amount_max_mln }
    """
    category: str = data.get("category", "")
    region: str = data.get("region", "")
    amount_min: float = float(data.get("amount_min_mln", 100)) * 1_000_000
    amount_max: float = float(data.get("amount_max_mln", 500)) * 1_000_000

    # Find similar tenders in DB
    query = select(func.avg(Tender.amount), func.count(Tender.id)).where(
        Tender.amount.isnot(None),
        Tender.amount >= amount_min * 0.5,
        Tender.amount <= amount_max * 2,
    )
    if category:
        query = query.where(Tender.category.ilike(f"%{_esc(category)}%", escape="\\"))
    if region:
        query = query.where(Tender.region.ilike(f"%{_esc(region)}%", escape="\\"))

    row = (await db.execute(query)).one()
    avg_amount, sample_count = row[0], row[1]

    if avg_amount and sample_count >= 3:
        # Use real data with ±15% band
        avg_mln = avg_amount / 1_000_000
        confidence = min(95, 65 + min(sample_count, 30))
        estimate_min = round(avg_mln * 0.85, 1)
        estimate_max = round(avg_mln * 1.15, 1)
    else:
        # Fall back to user-supplied range
        avg_mln = (amount_min + amount_max) / 2 / 1_000_000
        confidence = 60.0
        estimate_min = round(float(data.get("amount_min_mln", 100)), 1)
        estimate_max = round(float(data.get("amount_max_mln", 500)), 1)
        sample_count = 0

    return SuccessResponse(data=PriceEstimate(
        category=category,
        region=region,
        amount_min_mln=estimate_min,
        amount_max_mln=estimate_max,
        confidence=confidence,
        sample_count=sample_count,
        avg_tender_amount_mln=round(avg_mln, 1) if avg_amount else None,
    ))


# ── Price Strategy data ──────────────────────────────────────────────────────

class CategoryAmountStat(BaseModel):
    name: str
    avg: float
    min_val: float
    max_val: float
    count: int


class RegionAmountStat(BaseModel):
    name: str
    avg: float
    count: int


class BidHistoryItem(BaseModel):
    id: int
    tender_id: int
    tender_title: str
    bid_amount: Optional[float]
    status: str
    created_at: str


class PriceStrategyData(BaseModel):
    by_category: List[CategoryAmountStat]
    by_region: List[RegionAmountStat]
    bid_history: List[BidHistoryItem]


@router.get("/price-strategy", response_model=SuccessResponse[PriceStrategyData])
async def price_strategy_data(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate tender amounts by category and region + recent bid history."""
    from app.models.tenders.tender_result import TenderResult

    # Category stats
    cat_rows = (await db.execute(
        select(
            Tender.category,
            func.count().label("cnt"),
            func.coalesce(func.avg(Tender.amount), 0).label("avg"),
            func.coalesce(func.min(Tender.amount), 0).label("min_val"),
            func.coalesce(func.max(Tender.amount), 0).label("max_val"),
        )
        .where(Tender.is_deleted.is_(False))
        .where(Tender.category.isnot(None))
        .where(Tender.amount.isnot(None))
        .group_by(Tender.category)
        .order_by(func.count().desc())
        .limit(12)
    )).all()

    # Region stats
    reg_rows = (await db.execute(
        select(
            Tender.region,
            func.count().label("cnt"),
            func.coalesce(func.avg(Tender.amount), 0).label("avg"),
        )
        .where(Tender.is_deleted.is_(False))
        .where(Tender.region.isnot(None))
        .where(Tender.amount.isnot(None))
        .group_by(Tender.region)
        .order_by(func.count().desc())
        .limit(15)
    )).all()

    # Bid history
    bid_rows = (await db.execute(
        select(Bid, Tender.title.label("tender_title"))
        .join(Tender, Tender.id == Bid.tender_id, isouter=True)
        .order_by(Bid.created_at.desc())
        .limit(20)
    )).all()

    def mln(v: float) -> float:
        return round(v / 1_000_000, 1) if v else 0.0

    return SuccessResponse(data=PriceStrategyData(
        by_category=[
            CategoryAmountStat(
                name=r.category, count=r.cnt,
                avg=mln(r.avg), min_val=mln(r.min_val), max_val=mln(r.max_val),
            ) for r in cat_rows
        ],
        by_region=[
            RegionAmountStat(name=r.region, count=r.cnt, avg=mln(r.avg)) for r in reg_rows
        ],
        bid_history=[
            BidHistoryItem(
                id=bid.id, tender_id=bid.tender_id,
                tender_title=title or f"Tender #{bid.tender_id}",
                bid_amount=mln(bid.bid_amount) if bid.bid_amount else None,
                status=bid.status,
                created_at=str(bid.created_at)[:10],
            ) for bid, title in bid_rows
        ],
    ))
