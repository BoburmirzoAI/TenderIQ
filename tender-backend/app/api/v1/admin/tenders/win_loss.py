"""Admin win/loss journal — tender results and outcome statistics."""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import require_admin
from app.models.tenders.tender import Tender
from app.models.tenders.tender_result import TenderResult
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class TenderResultRead(BaseModel):
    id: int
    tender_id: int
    tender_title: Optional[str] = None
    tender_source: Optional[str] = None
    winner_name: str
    winner_stir: Optional[str] = None
    winning_amount: Optional[float] = None
    currency: str
    contract_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: str


class WinLossStats(BaseModel):
    total_results: int
    total_won_amount: float
    avg_winning_amount: float
    by_source: List[dict]


def _to_read(r: TenderResult) -> TenderResultRead:
    t = r.tender
    return TenderResultRead(
        id=r.id,
        tender_id=r.tender_id,
        tender_title=t.title if t else None,
        tender_source=t.source if t else None,
        winner_name=r.winner_name,
        winner_stir=r.winner_stir,
        winning_amount=r.winning_amount,
        currency=r.currency,
        contract_number=r.contract_number,
        notes=r.notes,
        created_at=str(r.created_at)[:10],
    )


@router.get("", response_model=SuccessResponse[List[TenderResultRead]])
async def list_results(
    limit: int = 100,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TenderResult)
        .options(selectinload(TenderResult.tender))
        .order_by(TenderResult.created_at.desc())
        .limit(limit)
    )
    return SuccessResponse(data=[_to_read(r) for r in result.scalars().all()])


@router.get("/stats", response_model=SuccessResponse[WinLossStats])
async def win_loss_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(select(func.count(TenderResult.id)))).scalar_one()
    total_amount = (await db.execute(
        select(func.sum(TenderResult.winning_amount)).where(TenderResult.winning_amount.isnot(None))
    )).scalar_one() or 0.0
    avg_amount = round(total_amount / total, 0) if total else 0.0

    source_rows = (await db.execute(
        select(Tender.source, func.count(TenderResult.id).label("cnt"))
        .join(TenderResult, TenderResult.tender_id == Tender.id)
        .group_by(Tender.source)
        .order_by(func.count(TenderResult.id).desc())
    )).all()

    return SuccessResponse(data=WinLossStats(
        total_results=total,
        total_won_amount=total_amount,
        avg_winning_amount=avg_amount,
        by_source=[{"source": r.source or "unknown", "count": r.cnt} for r in source_rows],
    ))
