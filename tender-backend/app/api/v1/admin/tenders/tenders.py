"""Admin tender management — list, update, bulk delete, stats by region/deadline."""

import json
import logging
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, select

from app.utils import escape_like as _esc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.exceptions import NotFoundException
from app.models.system.audit_log import AuditLog
from app.models.tenders.tender import Tender
from app.models.auth.user import User
from app.repositories.tenders.tender_repo import TenderRepository
from app.schemas.admin import AdminTenderBulkDelete, AdminTenderRead, AdminTenderUpdate
from app.schemas.base import PaginatedResponse, SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class AdminTenderCreate(BaseModel):
    title: str
    organization: str | None = None
    category: str | None = None
    region: str | None = None
    amount: float | None = None
    currency: str = "UZS"
    deadline: str | None = None
    description: str | None = None
    source: str = "admin"
    url: str | None = None
    contact_info: str | None = None
    requirements: str | None = None


@router.post("", response_model=SuccessResponse[AdminTenderRead])
async def create_tender(
    data: AdminTenderCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin manually creates a tender."""
    import uuid

    tender = Tender(
        external_id=f"admin-{uuid.uuid4().hex[:12]}",
        source=data.source,
        title=data.title,
        description=data.description,
        organization=data.organization,
        category=data.category,
        region=data.region,
        status="active",
        amount=data.amount,
        currency=data.currency,
        deadline=datetime.fromisoformat(data.deadline) if data.deadline else None,
        published_at=datetime.now(timezone.utc),
        url=data.url,
        contact_info=data.contact_info,
        requirements=data.requirements,
        search_text=f"{data.title} {data.organization or ''} {data.category or ''}".strip(),
    )
    db.add(tender)
    await db.flush()

    db.add(AuditLog(
        user_id=admin.id,
        action="tender_created",
        resource_type="tender",
        resource_id=tender.id,
        details=json.dumps({"title": data.title}),
    ))
    await db.commit()
    await db.refresh(tender)
    return SuccessResponse(data=AdminTenderRead.model_validate(tender))


@router.get("", response_model=PaginatedResponse[AdminTenderRead])
async def list_tenders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    status: str = Query(""),
    source: str = Query(""),
    category: str = Query(""),
    region: str = Query(""),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all tenders with filters and pagination."""
    stmt = select(Tender).where(Tender.is_deleted.is_(False))

    if search:
        stmt = stmt.where(
            or_(
                Tender.title.ilike(f"%{_esc(search)}%", escape="\\"),
                Tender.organization.ilike(f"%{_esc(search)}%", escape="\\"),
                Tender.external_id.ilike(f"%{_esc(search)}%", escape="\\"),
            )
        )
    if status:
        stmt = stmt.where(Tender.status == status)
    if source:
        stmt = stmt.where(Tender.source == source)
    if category:
        stmt = stmt.where(Tender.category == category)
    if region:
        stmt = stmt.where(Tender.region == region)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one() or 0
    total_pages = (total + per_page - 1) // per_page

    stmt = stmt.order_by(Tender.id.desc()).offset((page - 1) * per_page).limit(per_page)
    tenders = list((await db.execute(stmt)).scalars().all())

    return PaginatedResponse(
        data=[AdminTenderRead.model_validate(t) for t in tenders],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


@router.get("/stats", response_model=SuccessResponse[dict])
async def get_tender_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Tender counts by status and source."""
    tender_repo = TenderRepository(db)
    status_counts = await tender_repo.count_by_status()

    source_res = await db.execute(
        select(Tender.source, func.count().label("cnt"))
        .where(Tender.is_deleted.is_(False))
        .group_by(Tender.source)
    )
    source_counts = {row.source: row.cnt for row in source_res.all()}

    return SuccessResponse(data={"by_status": status_counts, "by_source": source_counts})


@router.get("/{tender_id}", response_model=SuccessResponse[AdminTenderRead])
async def get_tender(
    tender_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get single tender detail."""
    tender_repo = TenderRepository(db)
    tender = await tender_repo.get_by_id(tender_id)
    if not tender:
        raise NotFoundException("Tender", str(tender_id))
    return SuccessResponse(data=AdminTenderRead.model_validate(tender))


@router.patch("/{tender_id}", response_model=SuccessResponse[AdminTenderRead])
async def update_tender(
    tender_id: int,
    data: AdminTenderUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update tender fields."""
    tender_repo = TenderRepository(db)
    tender = await tender_repo.get_by_id(tender_id)
    if not tender:
        raise NotFoundException("Tender", str(tender_id))

    update_data = data.model_dump(exclude_unset=True)
    updated = await tender_repo.update(tender_id, update_data)

    db.add(AuditLog(
        user_id=admin.id,
        action="tender_updated",
        resource_type="tender",
        resource_id=tender_id,
        details=json.dumps(update_data),
    ))
    await db.commit()
    return SuccessResponse(data=AdminTenderRead.model_validate(updated))


@router.delete("/{tender_id}", response_model=SuccessResponse[dict])
async def delete_tender(
    tender_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete a tender."""
    tender_repo = TenderRepository(db)
    deleted = await tender_repo.soft_delete(tender_id)
    if not deleted:
        raise NotFoundException("Tender", str(tender_id))

    db.add(AuditLog(
        user_id=admin.id,
        action="tender_deleted",
        resource_type="tender",
        resource_id=tender_id,
    ))
    await db.commit()
    return SuccessResponse(data={"deleted": True})


@router.post("/bulk-delete", response_model=SuccessResponse[dict])
async def bulk_delete_tenders(
    data: AdminTenderBulkDelete,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete multiple tenders at once."""
    if not data.ids:
        raise HTTPException(status_code=400, detail="ID lar ro'yxati bo'sh")

    tender_repo = TenderRepository(db)
    deleted_count = 0
    for tid in data.ids:
        if await tender_repo.soft_delete(tid):
            deleted_count += 1

    db.add(AuditLog(
        user_id=admin.id,
        action="tenders_bulk_deleted",
        resource_type="tender",
        details=json.dumps({"ids": data.ids, "deleted": deleted_count}),
    ))
    await db.commit()
    return SuccessResponse(
        data={"deleted": deleted_count},
        message=f"{deleted_count} ta tender o'chirildi",
    )


class RegionCount(BaseModel):
    region: str
    count: int


class DateCount(BaseModel):
    date: str
    count: int


@router.get("/stats/by-region", response_model=SuccessResponse[List[RegionCount]])
async def tenders_by_region(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Tender count grouped by region."""
    rows = (await db.execute(
        select(Tender.region, func.count().label("cnt"))
        .where(Tender.is_deleted.is_(False))
        .where(Tender.region.isnot(None))
        .group_by(Tender.region)
        .order_by(func.count().desc())
        .limit(20)
    )).all()
    return SuccessResponse(data=[RegionCount(region=r.region or "Nomaʼlum", count=r.cnt) for r in rows])


@router.get("/stats/by-deadline", response_model=SuccessResponse[List[DateCount]])
async def tenders_by_deadline(
    days: int = Query(30, ge=7, le=90),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Tender count grouped by deadline date for next N days."""
    now = datetime.now(timezone.utc)
    until = now + timedelta(days=days)
    rows = (await db.execute(
        select(
            func.date(Tender.deadline).label("d"),
            func.count().label("cnt"),
        )
        .where(Tender.is_deleted.is_(False))
        .where(Tender.deadline >= now)
        .where(Tender.deadline <= until)
        .group_by(func.date(Tender.deadline))
        .order_by(func.date(Tender.deadline))
    )).all()
    return SuccessResponse(data=[DateCount(date=str(r.d), count=r.cnt) for r in rows])
