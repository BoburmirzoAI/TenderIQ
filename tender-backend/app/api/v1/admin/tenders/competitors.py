"""Admin competitors — top winning companies analysis from TenderResult."""

import logging
from typing import List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.tenders.tender import Tender
from app.models.tenders.tender_result import TenderResult
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class CompetitorStat(BaseModel):
    name: str
    stir: str | None
    wins: int
    total_amount: float
    avg_amount: float
    last_win: str | None


class CategoryStat(BaseModel):
    name: str
    count: int


class CompetitorOverview(BaseModel):
    total_companies: int
    total_tenders: int
    avg_amount: float
    top: List[CompetitorStat]
    by_category: List[CategoryStat]


@router.get("/overview", response_model=SuccessResponse[CompetitorOverview])
async def competitors_overview(
    limit: int = Query(20, ge=5, le=50),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Top companies by tender wins from TenderResult table."""
    top_rows = (await db.execute(
        select(
            TenderResult.winner_name,
            TenderResult.winner_stir,
            func.count().label("wins"),
            func.coalesce(func.sum(TenderResult.winning_amount), 0).label("total"),
            func.coalesce(func.avg(TenderResult.winning_amount), 0).label("avg"),
            func.max(TenderResult.created_at).label("last_win"),
        )
        .group_by(TenderResult.winner_name, TenderResult.winner_stir)
        .order_by(func.count().desc())
        .limit(limit)
    )).all()

    total_companies = (await db.execute(
        select(func.count(func.distinct(TenderResult.winner_name)))
    )).scalar_one() or 0

    total_tenders = (await db.execute(select(func.count()).select_from(TenderResult))).scalar_one() or 0

    avg_amount = (await db.execute(
        select(func.coalesce(func.avg(TenderResult.winning_amount), 0))
    )).scalar_one() or 0

    # Category breakdown from Tender table joined to TenderResult
    cat_rows = (await db.execute(
        select(Tender.category, func.count().label("cnt"))
        .join(TenderResult, TenderResult.tender_id == Tender.id, isouter=True)
        .where(Tender.category.isnot(None))
        .where(Tender.is_deleted.is_(False))
        .group_by(Tender.category)
        .order_by(func.count().desc())
        .limit(10)
    )).all()

    competitors = [
        CompetitorStat(
            name=r.winner_name,
            stir=r.winner_stir,
            wins=r.wins,
            total_amount=float(r.total or 0),
            avg_amount=float(r.avg or 0),
            last_win=str(r.last_win)[:10] if r.last_win else None,
        )
        for r in top_rows
    ]

    return SuccessResponse(data=CompetitorOverview(
        total_companies=total_companies,
        total_tenders=total_tenders,
        avg_amount=float(avg_amount),
        top=competitors,
        by_category=[CategoryStat(name=r.category, count=r.cnt) for r in cat_rows],
    ))
