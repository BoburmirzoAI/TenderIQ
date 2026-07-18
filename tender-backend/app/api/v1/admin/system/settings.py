"""Admin settings — feature flags and platform configuration."""

import json
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.system.audit_log import AuditLog
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory feature flags (production da DB yoki Redis ishlatiladi)
_FEATURE_FLAGS: dict[str, bool] = {
    "ai_matching": True,
    "email_notifications": True,
    "telegram_notifications": True,
    "websocket_events": True,
    "price_analysis": True,
    "pdf_export": True,
    "team_management": True,
    "api_access": True,
    "map_view": True,
    "maintenance_mode": False,
    "uzex_auth": False,
}

_PLATFORM_CONFIG: dict[str, Any] = {
    "free_daily_search_limit": 10,
    "pro_daily_search_limit": 100,
    "business_daily_search_limit": -1,
    "max_team_members_free": 1,
    "max_team_members_pro": 5,
    "max_team_members_business": 20,
    "password_reset_ttl_minutes": 15,
    "email_verify_ttl_hours": 24,
    "tender_scrape_interval_minutes": 30,
}


class FeatureFlagUpdate(BaseModel):
    value: bool


class ConfigUpdate(BaseModel):
    value: Any


@router.get("/flags", response_model=SuccessResponse[dict])
async def get_feature_flags(
    admin: User = Depends(require_admin),
):
    """Get all feature flags."""
    return SuccessResponse(data=dict(_FEATURE_FLAGS))


@router.patch("/flags/{flag_name}", response_model=SuccessResponse[dict])
async def update_feature_flag(
    flag_name: str,
    data: FeatureFlagUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Enable or disable a feature flag."""
    if flag_name not in _FEATURE_FLAGS:
        raise HTTPException(status_code=404, detail=f"Flag '{flag_name}' mavjud emas")

    old_value = _FEATURE_FLAGS[flag_name]
    _FEATURE_FLAGS[flag_name] = data.value

    db.add(AuditLog(
        user_id=admin.id,
        action="feature_flag_updated",
        resource_type="settings",
        details=json.dumps({"flag": flag_name, "old": old_value, "new": data.value}),
    ))
    await db.commit()
    logger.info("Admin %d set flag %s = %s", admin.id, flag_name, data.value)
    return SuccessResponse(
        data={flag_name: data.value},
        message=f"'{flag_name}' " + ("yoqildi" if data.value else "o'chirildi"),
    )


@router.get("/config", response_model=SuccessResponse[dict])
async def get_platform_config(
    admin: User = Depends(require_admin),
):
    """Get platform configuration values."""
    return SuccessResponse(data=dict(_PLATFORM_CONFIG))


@router.patch("/config/{key}", response_model=SuccessResponse[dict])
async def update_config_value(
    key: str,
    data: ConfigUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a single platform config value."""
    if key not in _PLATFORM_CONFIG:
        raise HTTPException(status_code=404, detail=f"Config '{key}' mavjud emas")

    old_value = _PLATFORM_CONFIG[key]
    _PLATFORM_CONFIG[key] = data.value

    db.add(AuditLog(
        user_id=admin.id,
        action="config_updated",
        resource_type="settings",
        details=json.dumps({"key": key, "old": old_value, "new": data.value}),
    ))
    await db.commit()
    return SuccessResponse(
        data={key: data.value},
        message=f"'{key}' yangilandi",
    )
