"""Middleware that enforces API endpoint permissions from Redis-cached rules."""

import logging

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.services.auth.permission_service import PermissionService

logger = logging.getLogger(__name__)

SKIP_PREFIXES = (
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/v1/auth/",
)


class PermissionMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path
        method = request.method

        if method == "OPTIONS" or any(path.startswith(p) for p in SKIP_PREFIXES):
            return await call_next(request)

        try:
            from app.database import async_session
            async with async_session() as db:
                perms = await PermissionService.get_cached(db)

            rule = PermissionService.find_rule(perms, path, method)
            if not rule:
                return await call_next(request)

            if not rule["is_enabled"]:
                return JSONResponse(
                    status_code=403,
                    content={"success": False, "error": "Bu endpoint vaqtincha o'chirilgan"},
                )

            user_id = getattr(request.state, "user_id", None) if hasattr(request, "state") else None
            user_roles = getattr(request.state, "user_roles", []) if hasattr(request, "state") else []
            is_admin = getattr(request.state, "is_admin", False) if hasattr(request, "state") else False

            if is_admin:
                return await call_next(request)

            if rule["blocked_user_ids"] and user_id and user_id in rule["blocked_user_ids"]:
                return JSONResponse(
                    status_code=403,
                    content={"success": False, "error": "Bu endpoint sizga cheklangan"},
                )

            if rule["allowed_roles"]:
                if not user_roles or not any(r in rule["allowed_roles"] for r in user_roles):
                    return JSONResponse(
                        status_code=403,
                        content={"success": False, "error": "Bu endpoint uchun sizda ruxsat yo'q"},
                    )

            if rule["rate_limit"] and user_id:
                allowed = await PermissionService.check_endpoint_rate(
                    user_id, path, method, rule["rate_limit"], rule["rate_window"]
                )
                if not allowed:
                    return JSONResponse(
                        status_code=429,
                        content={"success": False, "error": "Bu endpoint uchun limit oshirildi"},
                    )

        except Exception as e:
            logger.warning("Permission check failed: %s", str(e))

        return await call_next(request)
