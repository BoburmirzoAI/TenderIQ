"""Tender map endpoints — region-based tender statistics for map visualization."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import Float as SAFloat, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.tender import Tender
from app.models.user import User
from app.schemas.base import SuccessResponse

router = APIRouter()


@router.get("/regions", response_model=SuccessResponse[list])
async def region_stats(
    status: str | None = Query(None),
    category: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get tender counts and stats grouped by region for map view."""
    conditions = [
        Tender.is_deleted.is_(False),
        Tender.region.isnot(None),
    ]
    if status:
        conditions.append(Tender.status == status)
    if category:
        conditions.append(Tender.category == category)

    stmt = (
        select(
            Tender.region,
            func.count(Tender.id).label("total"),
            func.count(case((Tender.status == "active", 1))).label("active"),
            func.avg(case((Tender.amount > 0, Tender.amount), else_=None).cast(SAFloat)).label("avg_amount"),
            func.sum(case((Tender.amount > 0, Tender.amount), else_=0).cast(SAFloat)).label("total_amount"),
            func.min(Tender.amount).label("min_amount"),
            func.max(Tender.amount).label("max_amount"),
        )
        .where(*conditions)
        .group_by(Tender.region)
        .order_by(func.count(Tender.id).desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    return SuccessResponse(data=[
        {
            "region": row.region,
            "total": row.total,
            "active": row.active,
            "avg_amount": round(float(row.avg_amount or 0), 0),
            "total_amount": round(float(row.total_amount or 0), 0),
            "min_amount": round(float(row.min_amount or 0), 0),
            "max_amount": round(float(row.max_amount or 0), 0),
        }
        for row in rows
    ])


@router.get("/regions/{region}/tenders", response_model=SuccessResponse[list])
async def region_tenders(
    region: str,
    status: str | None = Query(None),
    category: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get recent tenders for a specific region."""
    conditions = [
        Tender.is_deleted.is_(False),
        Tender.region == region,
    ]
    if status:
        conditions.append(Tender.status == status)
    if category:
        conditions.append(Tender.category == category)

    result = await db.execute(
        select(Tender)
        .where(*conditions)
        .order_by(Tender.created_at.desc())
        .limit(limit)
    )
    tenders = result.scalars().all()

    return SuccessResponse(data=[
        {
            "id": t.id,
            "title": t.title,
            "organization": t.organization,
            "category": t.category,
            "status": t.status,
            "amount": t.amount,
            "currency": t.currency,
            "deadline": t.deadline.isoformat() if t.deadline else None,
        }
        for t in tenders
    ])
