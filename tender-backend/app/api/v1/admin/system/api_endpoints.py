"""Admin API endpoints — introspect registered routes, audit stats, and permission management."""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.system.audit_log import AuditLog
from app.models.system.api_permission import APIPermission
from app.models.auth.user import User
from app.schemas.base import SuccessResponse
from app.services.auth.permission_service import PermissionService

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class RouteInfo(BaseModel):
    path: str
    methods: List[str]
    name: str
    tags: List[str]
    requires_auth: bool


class AuditStat(BaseModel):
    action: str
    count: int


class APIOverviewStats(BaseModel):
    total_routes: int
    total_audit_entries: int
    top_actions: List[AuditStat]
    by_resource: List[Dict[str, Any]]


# ── Endpoints ─────────────────────────────────────────────────────────────────

def _collect_from_openapi(app) -> List[RouteInfo]:
    """Extract routes from OpenAPI schema — works regardless of router nesting."""
    schema = app.openapi()
    result: List[RouteInfo] = []
    auth_keywords = {
        "bearer", "token", "oauth", "security", "bearerauth", "jwt",
    }
    for path, methods in schema.get("paths", {}).items():
        for method, info in methods.items():
            if method.upper() in ("HEAD", "OPTIONS"):
                continue
            security = info.get("security", [])
            has_auth = bool(security) or any(
                kw in str(info.get("operationId", "")).lower()
                for kw in auth_keywords
            )
            result.append(RouteInfo(
                path=path,
                methods=[method.upper()],
                name=info.get("operationId", ""),
                tags=info.get("tags", []),
                requires_auth=has_auth,
            ))
    result.sort(key=lambda r: r.path)
    return result


@router.get("/routes", response_model=SuccessResponse[List[RouteInfo]])
async def list_routes(
    request: Request,
    admin: User = Depends(require_admin),
):
    """Return all registered FastAPI routes extracted from OpenAPI schema."""
    routes = _collect_from_openapi(request.app)
    return SuccessResponse(data=routes)


@router.get("/stats", response_model=SuccessResponse[APIOverviewStats])
async def api_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
    request: Request = None,
):
    """Aggregate API usage stats from audit log."""
    from fastapi.routing import APIRoute

    total_routes = 0
    if request:
        total_routes = len(_collect_from_openapi(request.app))

    total_audit = (await db.execute(select(func.count(AuditLog.id)))).scalar_one()

    top_actions_rows = (await db.execute(
        select(AuditLog.action, func.count(AuditLog.id).label("cnt"))
        .group_by(AuditLog.action)
        .order_by(func.count(AuditLog.id).desc())
        .limit(10)
    )).all()

    by_resource_rows = (await db.execute(
        select(AuditLog.resource_type, func.count(AuditLog.id).label("cnt"))
        .where(AuditLog.resource_type.isnot(None))
        .group_by(AuditLog.resource_type)
        .order_by(func.count(AuditLog.id).desc())
        .limit(10)
    )).all()

    return SuccessResponse(data=APIOverviewStats(
        total_routes=total_routes,
        total_audit_entries=total_audit,
        top_actions=[AuditStat(action=r.action, count=r.cnt) for r in top_actions_rows],
        by_resource=[{"resource": r.resource_type, "count": r.cnt} for r in by_resource_rows],
    ))


@router.get("/openapi", response_model=SuccessResponse[dict])
async def openapi_schema(
    request: Request,
    admin: User = Depends(require_admin),
):
    """Return the OpenAPI schema for documentation."""
    schema = request.app.openapi()
    paths = {}
    for path, methods in schema.get("paths", {}).items():
        paths[path] = {
            m: {
                "summary": info.get("summary", ""),
                "tags": info.get("tags", []),
                "operationId": info.get("operationId", ""),
            }
            for m, info in methods.items()
        }
    return SuccessResponse(data={"paths_count": len(paths), "paths": paths})


# ── Permission Management ────────────────────────────────────────────────────

class PermissionRuleCreate(BaseModel):
    path: str
    method: str
    is_enabled: bool = True
    allowed_roles: Optional[List[str]] = None
    blocked_user_ids: Optional[List[int]] = None
    rate_limit: Optional[int] = None
    rate_window: int = 60
    description: Optional[str] = None


class PermissionRuleUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    allowed_roles: Optional[List[str]] = None
    blocked_user_ids: Optional[List[int]] = None
    rate_limit: Optional[int] = None
    rate_window: Optional[int] = None
    description: Optional[str] = None


class PermissionRuleRead(BaseModel):
    id: int
    path: str
    method: str
    is_enabled: bool
    allowed_roles: Optional[List[str]]
    blocked_user_ids: Optional[List[int]]
    rate_limit: Optional[int]
    rate_window: int
    description: Optional[str]

    model_config = {"from_attributes": True}


@router.get("/permissions", response_model=SuccessResponse[List[PermissionRuleRead]])
async def list_permissions(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all API permission rules."""
    result = await db.execute(select(APIPermission).order_by(APIPermission.path))
    rules = result.scalars().all()
    return SuccessResponse(data=[PermissionRuleRead.model_validate(r) for r in rules])


@router.post("/permissions", response_model=SuccessResponse[PermissionRuleRead])
async def create_permission(
    data: PermissionRuleCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new endpoint permission rule."""
    existing = await db.execute(
        select(APIPermission).where(
            APIPermission.path == data.path,
            APIPermission.method == data.method.upper(),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Bu endpoint uchun qoida allaqachon mavjud")

    rule = APIPermission(
        path=data.path,
        method=data.method.upper(),
        is_enabled=data.is_enabled,
        allowed_roles=data.allowed_roles,
        blocked_user_ids=data.blocked_user_ids,
        rate_limit=data.rate_limit,
        rate_window=data.rate_window,
        description=data.description,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    await PermissionService.invalidate_cache()
    return SuccessResponse(data=PermissionRuleRead.model_validate(rule))


@router.patch("/permissions/{rule_id}", response_model=SuccessResponse[PermissionRuleRead])
async def update_permission(
    rule_id: int,
    data: PermissionRuleUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing permission rule."""
    rule = await db.get(APIPermission, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Qoida topilmadi")

    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(rule, key, val)

    await db.commit()
    await db.refresh(rule)
    await PermissionService.invalidate_cache()
    return SuccessResponse(data=PermissionRuleRead.model_validate(rule))


@router.delete("/permissions/{rule_id}", response_model=SuccessResponse[dict])
async def delete_permission(
    rule_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete a permission rule."""
    rule = await db.get(APIPermission, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Qoida topilmadi")

    await db.delete(rule)
    await db.commit()
    await PermissionService.invalidate_cache()
    return SuccessResponse(data={"deleted": True})


@router.post("/permissions/toggle/{rule_id}", response_model=SuccessResponse[PermissionRuleRead])
async def toggle_permission(
    rule_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Toggle endpoint enabled/disabled."""
    rule = await db.get(APIPermission, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Qoida topilmadi")

    rule.is_enabled = not rule.is_enabled
    await db.commit()
    await db.refresh(rule)
    await PermissionService.invalidate_cache()
    return SuccessResponse(data=PermissionRuleRead.model_validate(rule))
