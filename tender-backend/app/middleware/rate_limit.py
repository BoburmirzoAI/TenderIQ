"""Plan-based rate limiting middleware using Redis counters."""

import logging
from datetime import date

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.config import settings
from app.constants import PLAN_LIMITS, SubscriptionPlan

logger = logging.getLogger(__name__)

EXEMPT_PATHS = {
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
}

EXEMPT_PREFIXES = (
    "/api/v1/auth/",
    "/api/v1/subscriptions/",
    "/api/v1/payments/",
)

ANONYMOUS_DAILY_LIMIT = 1000


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Enforce daily request limits based on subscription plan."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """Check rate limits before processing the request."""
        if settings.APP_ENV == "test":
            return await call_next(request)

        path = request.url.path

        if path in EXEMPT_PATHS or any(path.startswith(p) for p in EXEMPT_PREFIXES):
            return await call_next(request)

        is_admin = getattr(request.state, "is_admin", False) if hasattr(request, "state") else False
        if is_admin:
            return await call_next(request)

        user_id = getattr(request.state, "user_id", None) if hasattr(request, "state") else None

        try:
            from app.services.auth.cache_service import cache_service

            today = date.today().isoformat()

            if user_id:
                key = f"rate_limit:{user_id}:{today}"
                plan_name = await cache_service.get(f"user_plan:{user_id}")
                try:
                    plan = SubscriptionPlan(plan_name) if plan_name else SubscriptionPlan.FREE
                except ValueError:
                    plan = SubscriptionPlan.FREE
                limit = PLAN_LIMITS[plan]["daily_requests"]
            else:
                client_ip = request.client.host if request.client else "unknown"
                key = f"rate_limit:anon:{client_ip}:{today}"
                limit = ANONYMOUS_DAILY_LIMIT

            current = await cache_service.increment(key)
            if current == 1:
                await cache_service.expire(key, 86400)

            if current > limit:
                return JSONResponse(
                    status_code=429,
                    content={
                        "success": False,
                        "error": "Rate limit exceeded. Upgrade your plan for higher limits.",
                        "upgrade_url": "/api/v1/subscriptions/plans",
                    },
                )
        except Exception as e:
            logger.warning("Rate limit check failed: %s", str(e))

        return await call_next(request)
