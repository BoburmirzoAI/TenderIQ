"""JWT extraction middleware for request context."""

import logging

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.utils.security import decode_token

logger = logging.getLogger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    """Extracts JWT user info and attaches it to request state."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """Extract user info from JWT if present."""
        request.state.user_id = None
        request.state.is_admin = False

        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            try:
                payload = decode_token(token)
                user_id = payload.get("sub")
                if user_id:
                    request.state.user_id = user_id
                    from app.database import async_session
                    from app.repositories.user_repo import UserRepository
                    async with async_session() as db:
                        repo = UserRepository(db)
                        user = await repo.get_by_id(int(user_id))
                        if user:
                            request.state.is_admin = user.is_admin or user.is_superadmin
            except Exception:
                pass

        return await call_next(request)
