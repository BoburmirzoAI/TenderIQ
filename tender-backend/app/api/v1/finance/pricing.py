"""Smart Pricing — optimal bid price analysis based on historical tender data."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Float as SAFloat, and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.tenders.tender import Tender
from app.models.tenders.tender_result import TenderResult
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

router = APIRouter()


@router.get("/analyze/{tender_id}", response_model=SuccessResponse[dict])
async def analyze_tender_price(
    tender_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Analyze optimal bid price for a specific tender based on similar completed tenders."""
    tender = await db.get(Tender, tender_id)
    if not tender or tender.is_deleted:
        raise HTTPException(status_code=404, detail="Tender topilmadi")

    if not tender.amount or tender.amount <= 0:
        raise HTTPException(status_code=400, detail="Tender summasi ko'rsatilmagan")

    conditions = [
        Tender.is_deleted.is_(False),
        Tender.amount.isnot(None),
        Tender.amount > 0,
        TenderResult.winning_amount.isnot(None),
        TenderResult.winning_amount > 0,
    ]
    if tender.category:
        conditions.append(Tender.category == tender.category)
    if tender.region:
        conditions.append(Tender.region == tender.region)

    stmt = (
        select(
            Tender.amount.label("original_amount"),
            TenderResult.winning_amount.label("winning_amount"),
        )
        .join(TenderResult, TenderResult.tender_id == Tender.id)
        .where(and_(*conditions))
        .order_by(Tender.created_at.desc())
        .limit(200)
    )
    result = await db.execute(stmt)
    rows = result.all()

    if len(rows) < 3:
        return SuccessResponse(data={
            "tender_id": tender_id,
            "tender_amount": tender.amount,
            "has_data": False,
            "message": "Yetarli tarixiy ma'lumot topilmadi (kamida 3 ta yakunlangan tender kerak)",
            "sample_count": len(rows),
        })

    discounts = []
    for row in rows:
        if row.original_amount > 0:
            discount_pct = ((row.original_amount - row.winning_amount) / row.original_amount) * 100
            discounts.append(max(0, min(discount_pct, 100)))

    discounts.sort()
    n = len(discounts)
    avg_discount = sum(discounts) / n
    median_discount = discounts[n // 2] if n % 2 else (discounts[n // 2 - 1] + discounts[n // 2]) / 2
    min_discount = discounts[0]
    max_discount = discounts[-1]

    p25 = discounts[int(n * 0.25)]
    p75 = discounts[int(n * 0.75)]

    conservative_price = tender.amount * (1 - min_discount / 100)
    optimal_price = tender.amount * (1 - median_discount / 100)
    aggressive_price = tender.amount * (1 - p75 / 100)

    ranges = [
        {"label": "0-5%", "min": 0, "max": 5, "count": 0},
        {"label": "5-10%", "min": 5, "max": 10, "count": 0},
        {"label": "10-15%", "min": 10, "max": 15, "count": 0},
        {"label": "15-20%", "min": 15, "max": 20, "count": 0},
        {"label": "20-30%", "min": 20, "max": 30, "count": 0},
        {"label": "30%+", "min": 30, "max": 100, "count": 0},
    ]
    for d in discounts:
        for r in ranges:
            if r["min"] <= d < r["max"]:
                r["count"] += 1
                break

    return SuccessResponse(data={
        "tender_id": tender_id,
        "tender_amount": tender.amount,
        "currency": tender.currency,
        "category": tender.category,
        "region": tender.region,
        "has_data": True,
        "sample_count": n,
        "discount_stats": {
            "avg_pct": round(avg_discount, 1),
            "median_pct": round(median_discount, 1),
            "min_pct": round(min_discount, 1),
            "max_pct": round(max_discount, 1),
            "p25_pct": round(p25, 1),
            "p75_pct": round(p75, 1),
        },
        "recommendations": {
            "conservative": {
                "price": round(conservative_price, 2),
                "discount_pct": round(min_discount, 1),
                "win_chance": "past",
                "description": "Eng kam chegirma — xavfsiz, lekin yutish ehtimoli past",
            },
            "optimal": {
                "price": round(optimal_price, 2),
                "discount_pct": round(median_discount, 1),
                "win_chance": "o'rta",
                "description": "O'rtacha chegirma — narx va yutish o'rtasida muvozanat",
            },
            "aggressive": {
                "price": round(aggressive_price, 2),
                "discount_pct": round(p75, 1),
                "win_chance": "yuqori",
                "description": "Kuchli chegirma — yutish ehtimoli yuqori, foyda kamroq",
            },
        },
        "distribution": [
            {"label": r["label"], "count": r["count"], "pct": round(r["count"] / n * 100, 1)}
            for r in ranges
        ],
    })


@router.get("/category-stats", response_model=SuccessResponse[list])
async def category_price_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get average discount percentages grouped by category."""
    stmt = (
        select(
            Tender.category,
            func.count(TenderResult.id).label("total"),
            func.avg(
                case(
                    (
                        Tender.amount > 0,
                        ((Tender.amount - TenderResult.winning_amount) / Tender.amount * 100),
                    ),
                    else_=None,
                ).cast(SAFloat)
            ).label("avg_discount"),
            func.avg(TenderResult.winning_amount).label("avg_winning_amount"),
            func.min(
                case(
                    (
                        Tender.amount > 0,
                        ((Tender.amount - TenderResult.winning_amount) / Tender.amount * 100),
                    ),
                    else_=None,
                ).cast(SAFloat)
            ).label("min_discount"),
            func.max(
                case(
                    (
                        Tender.amount > 0,
                        ((Tender.amount - TenderResult.winning_amount) / Tender.amount * 100),
                    ),
                    else_=None,
                ).cast(SAFloat)
            ).label("max_discount"),
        )
        .join(TenderResult, TenderResult.tender_id == Tender.id)
        .where(
            Tender.is_deleted.is_(False),
            Tender.amount > 0,
            Tender.category.isnot(None),
            TenderResult.winning_amount.isnot(None),
            TenderResult.winning_amount > 0,
        )
        .group_by(Tender.category)
        .having(func.count(TenderResult.id) >= 3)
        .order_by(func.count(TenderResult.id).desc())
        .limit(20)
    )
    result = await db.execute(stmt)
    rows = result.all()

    return SuccessResponse(data=[
        {
            "category": row.category,
            "total_tenders": row.total,
            "avg_discount_pct": round(float(row.avg_discount or 0), 1),
            "min_discount_pct": round(float(row.min_discount or 0), 1),
            "max_discount_pct": round(float(row.max_discount or 0), 1),
            "avg_winning_amount": round(float(row.avg_winning_amount or 0), 0),
        }
        for row in rows
    ])


@router.get("/region-stats", response_model=SuccessResponse[list])
async def region_price_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get average discount percentages grouped by region."""
    stmt = (
        select(
            Tender.region,
            func.count(TenderResult.id).label("total"),
            func.avg(
                case(
                    (
                        Tender.amount > 0,
                        ((Tender.amount - TenderResult.winning_amount) / Tender.amount * 100),
                    ),
                    else_=None,
                ).cast(SAFloat)
            ).label("avg_discount"),
            func.avg(TenderResult.winning_amount).label("avg_winning_amount"),
        )
        .join(TenderResult, TenderResult.tender_id == Tender.id)
        .where(
            Tender.is_deleted.is_(False),
            Tender.amount > 0,
            Tender.region.isnot(None),
            TenderResult.winning_amount.isnot(None),
            TenderResult.winning_amount > 0,
        )
        .group_by(Tender.region)
        .having(func.count(TenderResult.id) >= 3)
        .order_by(func.count(TenderResult.id).desc())
        .limit(20)
    )
    result = await db.execute(stmt)
    rows = result.all()

    return SuccessResponse(data=[
        {
            "region": row.region,
            "total_tenders": row.total,
            "avg_discount_pct": round(float(row.avg_discount or 0), 1),
            "avg_winning_amount": round(float(row.avg_winning_amount or 0), 0),
        }
        for row in rows
    ])


@router.get("/my-history", response_model=SuccessResponse[dict])
async def my_pricing_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user's bid history with win/loss analysis."""
    from app.models.tenders.tender_application import TenderApplication

    stmt = (
        select(
            TenderApplication.bid_amount,
            TenderApplication.result,
            TenderApplication.stage,
            Tender.amount.label("tender_amount"),
            Tender.category,
            Tender.region,
            Tender.title,
            TenderApplication.tender_id,
        )
        .join(Tender, Tender.id == TenderApplication.tender_id)
        .where(
            TenderApplication.user_id == user.id,
            TenderApplication.bid_amount.isnot(None),
            TenderApplication.bid_amount > 0,
            Tender.amount.isnot(None),
            Tender.amount > 0,
        )
        .order_by(TenderApplication.created_at.desc())
        .limit(50)
    )
    result = await db.execute(stmt)
    rows = result.all()

    bids = []
    wins = []
    losses = []
    for row in rows:
        discount_pct = ((row.tender_amount - row.bid_amount) / row.tender_amount) * 100
        bid_info = {
            "tender_id": row.tender_id,
            "title": row.title,
            "category": row.category,
            "tender_amount": row.tender_amount,
            "bid_amount": row.bid_amount,
            "discount_pct": round(max(0, discount_pct), 1),
            "result": row.result,
            "stage": row.stage,
        }
        bids.append(bid_info)
        if row.result == "won":
            wins.append(discount_pct)
        elif row.result == "lost":
            losses.append(discount_pct)

    summary = {
        "total_bids": len(bids),
        "wins": len(wins),
        "losses": len(losses),
        "win_rate": round(len(wins) / len(bids) * 100, 1) if bids else 0,
        "avg_win_discount": round(sum(wins) / len(wins), 1) if wins else None,
        "avg_loss_discount": round(sum(losses) / len(losses), 1) if losses else None,
    }

    return SuccessResponse(data={
        "summary": summary,
        "bids": bids,
    })
