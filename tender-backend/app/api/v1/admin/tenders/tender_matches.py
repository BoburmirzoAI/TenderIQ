"""Admin tender matches — ML match results between tenders and companies."""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.companies.company import Company
from app.models.tenders.tender import Tender
from app.models.tenders.tender_match import TenderMatch
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class MatchRead(BaseModel):
    id: int
    tender_id: int
    tender_title: Optional[str] = None
    tender_source: Optional[str] = None
    company_id: int
    company_name: Optional[str] = None
    score: float
    text_score: Optional[float] = None
    category_score: Optional[float] = None
    region_score: Optional[float] = None
    amount_score: Optional[float] = None
    is_notified: bool
    is_saved: bool
    created_at: str


class MatchStats(BaseModel):
    total_matches: int
    notified: int
    saved: int
    avg_score: float
    high_score_count: int


def _to_read(m: TenderMatch) -> MatchRead:
    return MatchRead(
        id=m.id,
        tender_id=m.tender_id,
        tender_title=m.tender.title if m.tender else None,
        tender_source=m.tender.source if m.tender else None,
        company_id=m.company_id,
        company_name=m.company.name if m.company else None,
        score=round(m.score, 4),
        text_score=round(m.text_score, 4) if m.text_score is not None else None,
        category_score=round(m.category_score, 4) if m.category_score is not None else None,
        region_score=round(m.region_score, 4) if m.region_score is not None else None,
        amount_score=round(m.amount_score, 4) if m.amount_score is not None else None,
        is_notified=m.is_notified,
        is_saved=m.is_saved,
        created_at=str(m.created_at)[:10],
    )


@router.get("", response_model=SuccessResponse[List[MatchRead]])
async def list_matches(
    min_score: Optional[float] = None,
    is_saved: Optional[bool] = None,
    limit: int = 100,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(TenderMatch)
        .order_by(TenderMatch.score.desc())
        .limit(limit)
    )
    if min_score is not None:
        query = query.where(TenderMatch.score >= min_score)
    if is_saved is not None:
        query = query.where(TenderMatch.is_saved == is_saved)
    result = await db.execute(query)
    return SuccessResponse(data=[_to_read(m) for m in result.scalars().all()])


@router.get("/stats", response_model=SuccessResponse[MatchStats])
async def match_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(select(func.count(TenderMatch.id)))).scalar_one()
    notified = (await db.execute(
        select(func.count(TenderMatch.id)).where(TenderMatch.is_notified == True)
    )).scalar_one()
    saved = (await db.execute(
        select(func.count(TenderMatch.id)).where(TenderMatch.is_saved == True)
    )).scalar_one()
    avg = (await db.execute(select(func.avg(TenderMatch.score)))).scalar_one() or 0.0
    high = (await db.execute(
        select(func.count(TenderMatch.id)).where(TenderMatch.score >= 0.7)
    )).scalar_one()

    return SuccessResponse(data=MatchStats(
        total_matches=total,
        notified=notified,
        saved=saved,
        avg_score=round(float(avg), 3),
        high_score_count=high,
    ))
