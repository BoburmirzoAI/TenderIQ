"""Admin pipeline — tender application kanban stages."""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.tenders.tender import Tender
from app.models.tenders.tender_application import TenderApplication
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()

STAGES = ["discovered", "analyzing", "preparing", "submitted", "won", "lost"]


class ApplicationRead(BaseModel):
    id: int
    user_id: int
    user_email: Optional[str] = None
    tender_id: int
    tender_title: Optional[str] = None
    tender_amount: Optional[float] = None
    stage: str
    priority: str
    bid_amount: Optional[float] = None
    win_probability: Optional[float] = None
    result: Optional[str] = None
    created_at: str


class PipelineStats(BaseModel):
    total: int
    by_stage: Dict[str, int]
    total_bid_amount: float
    won_count: int
    lost_count: int


def _to_read(app: TenderApplication, user_email: Optional[str], tender: Optional[Tender]) -> ApplicationRead:
    return ApplicationRead(
        id=app.id,
        user_id=app.user_id,
        user_email=user_email,
        tender_id=app.tender_id,
        tender_title=tender.title if tender else None,
        tender_amount=tender.amount if tender else None,
        stage=app.stage,
        priority=app.priority,
        bid_amount=app.bid_amount,
        win_probability=app.win_probability,
        result=app.result,
        created_at=str(app.created_at)[:10],
    )


@router.get("", response_model=SuccessResponse[List[ApplicationRead]])
async def list_pipeline(
    stage: Optional[str] = None,
    limit: int = 100,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(TenderApplication, User.email, Tender)
        .join(User, User.id == TenderApplication.user_id, isouter=True)
        .join(Tender, Tender.id == TenderApplication.tender_id, isouter=True)
        .order_by(TenderApplication.created_at.desc())
        .limit(limit)
    )
    if stage:
        query = query.where(TenderApplication.stage == stage)
    rows = (await db.execute(query)).all()
    return SuccessResponse(data=[_to_read(app, email, tender) for app, email, tender in rows])


@router.get("/stats", response_model=SuccessResponse[PipelineStats])
async def pipeline_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(select(func.count(TenderApplication.id)))).scalar_one()
    total_bid = (await db.execute(
        select(func.sum(TenderApplication.bid_amount)).where(TenderApplication.bid_amount.isnot(None))
    )).scalar_one() or 0.0
    won = (await db.execute(
        select(func.count(TenderApplication.id)).where(TenderApplication.result == "won")
    )).scalar_one()
    lost = (await db.execute(
        select(func.count(TenderApplication.id)).where(TenderApplication.result == "lost")
    )).scalar_one()

    by_stage_rows = (await db.execute(
        select(TenderApplication.stage, func.count(TenderApplication.id).label("cnt"))
        .group_by(TenderApplication.stage)
    )).all()
    by_stage: Dict[str, int] = {s: 0 for s in STAGES}
    for row in by_stage_rows:
        by_stage[row.stage] = row.cnt

    return SuccessResponse(data=PipelineStats(
        total=total,
        by_stage=by_stage,
        total_bid_amount=total_bid,
        won_count=won,
        lost_count=lost,
    ))


@router.patch("/{app_id}", response_model=SuccessResponse[ApplicationRead])
async def update_application(
    app_id: int,
    data: dict,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a pipeline application (stage, bid_amount, priority, etc.)."""
    from fastapi import HTTPException
    result = await db.execute(
        select(TenderApplication, User.email, Tender)
        .join(User, User.id == TenderApplication.user_id, isouter=True)
        .join(Tender, Tender.id == TenderApplication.tender_id, isouter=True)
        .where(TenderApplication.id == app_id)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Application topilmadi")
    app, email, tender = row
    allowed = {"stage", "priority", "bid_amount", "win_probability", "result"}
    for k, v in data.items():
        if k in allowed:
            if k == "stage" and v not in STAGES:
                raise HTTPException(status_code=400, detail=f"Noto'g'ri stage: {v}")
            setattr(app, k, v)
    await db.commit()
    await db.refresh(app)
    return SuccessResponse(data=_to_read(app, email, tender))


@router.get("/kanban", response_model=SuccessResponse[Dict[str, Any]])
async def kanban_view(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Kanban board: each stage with its applications."""
    rows = (await db.execute(
        select(TenderApplication, User.email, Tender)
        .join(User, User.id == TenderApplication.user_id, isouter=True)
        .join(Tender, Tender.id == TenderApplication.tender_id, isouter=True)
        .order_by(TenderApplication.created_at.desc())
        .limit(300)
    )).all()

    board: Dict[str, List[ApplicationRead]] = {s: [] for s in STAGES}
    for app, email, tender in rows:
        stage = app.stage if app.stage in board else "discovered"
        board[stage].append(_to_read(app, email, tender))

    return SuccessResponse(data=board)
