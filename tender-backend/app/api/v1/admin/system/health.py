"""Admin system health — DB, Redis, Celery, ML service status, activity."""

import logging
import time
from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.system.audit_log import AuditLog
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=SuccessResponse[dict])
async def system_health(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Check health of all backend services."""
    checks: dict[str, dict] = {}

    # PostgreSQL
    t0 = time.perf_counter()
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = {
            "status": "ok",
            "latency_ms": round((time.perf_counter() - t0) * 1000, 1),
        }
    except Exception as e:
        checks["database"] = {"status": "error", "detail": str(e)[:80]}

    # Redis — CacheService.get() orqali tekshiramiz
    t0 = time.perf_counter()
    try:
        from app.services.auth.cache_service import cache_service
        await cache_service.set("__health_check__", "ok", expire=10)
        val = await cache_service.get("__health_check__")
        checks["redis"] = {
            "status": "ok" if val == "ok" else "degraded",
            "latency_ms": round((time.perf_counter() - t0) * 1000, 1),
        }
    except Exception as e:
        checks["redis"] = {"status": "error", "detail": str(e)[:80]}

    # Celery — worker borligini tekshiramiz
    try:
        from app.tasks.celery_app import celery_app
        inspect = celery_app.control.inspect(timeout=1.5)
        active = inspect.active()
        checks["celery"] = {
            "status": "ok" if active else "degraded",
            "workers": len(active) if active else 0,
        }
    except Exception as e:
        checks["celery"] = {"status": "error", "detail": str(e)[:80]}

    # ML service (built-in)
    try:
        from app.services.ai.ml_service import MLService
        t0 = time.perf_counter()
        ml = MLService()
        model = await ml.load_model()
        latency = round((time.perf_counter() - t0) * 1000, 1)
        checks["ml_service"] = {
            "status": "ok",
            "latency_ms": latency,
            "model_loaded": model.is_trained if hasattr(model, "is_trained") else True,
        }
    except Exception as e:
        checks["ml_service"] = {"status": "degraded", "detail": str(e)[:80]}

    overall = "ok" if all(c["status"] == "ok" for c in checks.values()) else "degraded"
    return SuccessResponse(data={"overall": overall, "checks": checks})


class ActivityEvent(BaseModel):
    id: int
    action: str
    resource_type: str
    resource_id: int | None
    user_id: int | None
    user_email: str | None
    details: str | None
    ip_address: str | None
    user_agent: str | None
    created_at: str


class WSActivity(BaseModel):
    recent_actions: int
    unique_users: int
    events: List[ActivityEvent]
    channels: Dict[str, int]


@router.get("/activity", response_model=SuccessResponse[WSActivity])
async def recent_activity(
    limit: int = 20,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Recent audit log entries as WebSocket-style activity monitor."""
    from sqlalchemy.orm import aliased
    UserAlias = aliased(User)

    rows = (await db.execute(
        select(AuditLog, UserAlias.email)
        .outerjoin(UserAlias, AuditLog.user_id == UserAlias.id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )).all()

    unique_users = len({r[0].user_id for r in rows if r[0].user_id})

    channels: Dict[str, int] = {}
    for r_tuple in rows:
        r = r_tuple[0]
        ch = r.resource_type or "system"
        channels[ch] = channels.get(ch, 0) + 1

    events = [
        ActivityEvent(
            id=r.id,
            action=r.action,
            resource_type=r.resource_type or "system",
            resource_id=r.resource_id,
            user_id=r.user_id,
            user_email=email,
            details=r.details,
            ip_address=r.ip_address,
            user_agent=r.user_agent,
            created_at=str(r.created_at)[:19],
        )
        for r, email in rows
    ]

    return SuccessResponse(data=WSActivity(
        recent_actions=len(rows),
        unique_users=unique_users,
        events=events,
        channels=channels,
    ))
