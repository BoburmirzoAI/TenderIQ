"""API permission enforcement with Redis caching."""

import json
import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.system.api_permission import APIPermission
from app.services.auth.cache_service import cache_service

logger = logging.getLogger(__name__)

CACHE_KEY = "api_permissions:all"
CACHE_TTL = 300


class PermissionService:

    @staticmethod
    async def load_all(db: AsyncSession) -> list[dict]:
        result = await db.execute(select(APIPermission))
        rows = result.scalars().all()
        return [
            {
                "id": r.id,
                "path": r.path,
                "method": r.method,
                "is_enabled": r.is_enabled,
                "allowed_roles": r.allowed_roles or [],
                "blocked_user_ids": r.blocked_user_ids or [],
                "rate_limit": r.rate_limit,
                "rate_window": r.rate_window,
                "description": r.description,
            }
            for r in rows
        ]

    @staticmethod
    async def get_cached(db: AsyncSession) -> list[dict]:
        raw = await cache_service.get(CACHE_KEY)
        if raw:
            try:
                return json.loads(raw)
            except (json.JSONDecodeError, TypeError):
                pass
        perms = await PermissionService.load_all(db)
        await cache_service.set(CACHE_KEY, json.dumps(perms), expire=CACHE_TTL)
        return perms

    @staticmethod
    async def invalidate_cache():
        await cache_service.delete(CACHE_KEY)

    @staticmethod
    def find_rule(perms: list[dict], path: str, method: str) -> Optional[dict]:
        method_up = method.upper()
        for p in perms:
            if p["path"] == path and p["method"] == method_up:
                return p
        for p in perms:
            pattern = p["path"]
            if "{" in pattern and p["method"] == method_up:
                if PermissionService._match_path(pattern, path):
                    return p
        return None

    @staticmethod
    def _match_path(pattern: str, actual: str) -> bool:
        p_parts = pattern.rstrip("/").split("/")
        a_parts = actual.rstrip("/").split("/")
        if len(p_parts) != len(a_parts):
            return False
        for pp, ap in zip(p_parts, a_parts):
            if pp.startswith("{") and pp.endswith("}"):
                continue
            if pp != ap:
                return False
        return True

    @staticmethod
    async def check_endpoint_rate(user_id: int, path: str, method: str, limit: int, window: int) -> bool:
        from datetime import date
        key = f"ep_rate:{method}:{path}:{user_id}:{date.today().isoformat()}"
        current = await cache_service.increment(key)
        if current == 1:
            await cache_service.expire(key, window)
        return current <= limit
