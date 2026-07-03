"""Purchase plans — planned tenders before official announcement."""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.utils import escape_like as _esc
from app.models.auth.user import User
from app.models.tenders.purchase_plan import PurchasePlan
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class PlanRead(BaseModel):
    id: int
    plan_number: Optional[str] = None
    title: str
    organization: str
    organization_stir: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None
    budget_type: Optional[str] = None
    estimated_amount: Optional[float] = None
    currency: str = "UZS"
    planned_date: Optional[str] = None
    status: str
    lot_count: Optional[int] = None
    lot_type: Optional[str] = None
    created_at: str


class PlanStats(BaseModel):
    total: int
    by_status: dict
    by_category: dict
    by_region: dict
    total_amount: float


@router.get("", response_model=SuccessResponse[List[PlanRead]])
async def list_plans(
    category: Optional[str] = None,
    region: Optional[str] = None,
    budget_type: Optional[str] = None,
    status: Optional[str] = None,
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(PurchasePlan)

    if category:
        query = query.where(PurchasePlan.category == category)
    if region:
        query = query.where(PurchasePlan.region == region)
    if budget_type:
        query = query.where(PurchasePlan.budget_type == budget_type)
    if status:
        query = query.where(PurchasePlan.status == status)
    if q:
        query = query.where(PurchasePlan.title.ilike(f"%{_esc(q)}%", escape="\\"))

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    result = await db.execute(
        query.order_by(PurchasePlan.created_at.desc())
        .offset((page - 1) * size).limit(size)
    )
    plans = result.scalars().all()

    return SuccessResponse(
        data=[_to_read(p) for p in plans],
        total=total,
    )


@router.get("/stats", response_model=SuccessResponse[PlanStats])
async def plan_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(select(func.count(PurchasePlan.id)))).scalar_one()

    status_result = await db.execute(
        select(PurchasePlan.status, func.count(PurchasePlan.id))
        .group_by(PurchasePlan.status)
    )
    by_status = {r[0]: r[1] for r in status_result.all()}

    cat_result = await db.execute(
        select(PurchasePlan.category, func.count(PurchasePlan.id))
        .where(PurchasePlan.category.isnot(None))
        .group_by(PurchasePlan.category)
        .order_by(func.count(PurchasePlan.id).desc()).limit(10)
    )
    by_category = {r[0]: r[1] for r in cat_result.all()}

    region_result = await db.execute(
        select(PurchasePlan.region, func.count(PurchasePlan.id))
        .where(PurchasePlan.region.isnot(None))
        .group_by(PurchasePlan.region)
        .order_by(func.count(PurchasePlan.id).desc()).limit(10)
    )
    by_region = {r[0]: r[1] for r in region_result.all()}

    total_amount = (await db.execute(
        select(func.coalesce(func.sum(PurchasePlan.estimated_amount), 0))
    )).scalar_one()

    return SuccessResponse(data=PlanStats(
        total=total,
        by_status=by_status,
        by_category=by_category,
        by_region=by_region,
        total_amount=float(total_amount),
    ))


@router.get("/{plan_id}", response_model=SuccessResponse[PlanRead])
async def get_plan(
    plan_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException
    result = await db.execute(select(PurchasePlan).where(PurchasePlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Xarid-reja topilmadi")
    return SuccessResponse(data=_to_read(plan))


def _to_read(p: PurchasePlan) -> PlanRead:
    return PlanRead(
        id=p.id,
        plan_number=p.plan_number,
        title=p.title,
        organization=p.organization,
        organization_stir=p.organization_stir,
        category=p.category,
        region=p.region,
        budget_type=p.budget_type,
        estimated_amount=p.estimated_amount,
        currency=p.currency,
        planned_date=str(p.planned_date) if p.planned_date else None,
        status=p.status,
        lot_count=p.lot_count,
        lot_type=p.lot_type,
        created_at=str(p.created_at),
    )
