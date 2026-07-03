"""Admin audit log — read-only activity trail."""

import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.utils import escape_like as _esc
from app.models.system.audit_log import AuditLog
from app.models.auth.user import User
from app.schemas.admin import AuditLogEntry
from app.schemas.base import PaginatedResponse, SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=PaginatedResponse[AuditLogEntry])
async def list_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=200),
    actor_id: int = Query(0),
    resource_type: str = Query(""),
    action: str = Query(""),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return all admin action logs with filters."""
    stmt = select(AuditLog)

    if actor_id:
        stmt = stmt.where(AuditLog.user_id == actor_id)
    if resource_type:
        stmt = stmt.where(AuditLog.resource_type == resource_type)
    if action:
        stmt = stmt.where(AuditLog.action.ilike(f"%{_esc(action)}%", escape="\\"))

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one() or 0
    total_pages = (total + per_page - 1) // per_page

    stmt = stmt.order_by(AuditLog.id.desc()).offset((page - 1) * per_page).limit(per_page)
    logs = list((await db.execute(stmt)).scalars().all())

    items = []
    for log in logs:
        entry = AuditLogEntry.model_validate(log)
        if log.user_id:
            actor_res = await db.execute(
                select(User.email).where(User.id == log.user_id)
            )
            actor = actor_res.first()
            if actor:
                entry.admin_email = actor.email
        items.append(entry)

    return PaginatedResponse(
        data=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


@router.get("/stats", response_model=SuccessResponse[dict])
async def audit_log_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Audit log statistics — totals by action and resource type."""
    total = (await db.execute(select(func.count(AuditLog.id)))).scalar_one() or 0

    by_action_rows = (await db.execute(
        select(AuditLog.action, func.count().label("cnt"))
        .group_by(AuditLog.action)
        .order_by(func.count().desc())
        .limit(20)
    )).all()

    by_resource_rows = (await db.execute(
        select(AuditLog.resource_type, func.count().label("cnt"))
        .group_by(AuditLog.resource_type)
        .order_by(func.count().desc())
    )).all()

    return SuccessResponse(data={
        "total": total,
        "by_action": {r.action: r.cnt for r in by_action_rows},
        "by_resource": {(r.resource_type or "system"): r.cnt for r in by_resource_rows},
    })


@router.get("/actions", response_model=list[str])
async def list_available_actions(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return all unique action names for filter dropdowns."""
    result = await db.execute(
        select(AuditLog.action).distinct().order_by(AuditLog.action)
    )
    return [row.action for row in result.all()]
