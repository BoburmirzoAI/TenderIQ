"""Authentication endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.base import SuccessResponse
from app.schemas.user import UserRead, UserUpdate
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_UPDATE_FIELDS = {
    "full_name", "phone", "telegram_username", "language",
    "avatar_url", "notify_new_tenders", "notify_match",
    "notify_deadline", "notify_results", "notify_email",
    "notify_telegram", "theme",
}


async def _check_rate_limit(request: Request, action: str, limit: int, window: int) -> None:
    """Check Redis rate limit per IP. Raises 429 if exceeded."""
    try:
        import redis.asyncio as aioredis
        from app.config import settings

        client_ip = request.client.host if request.client else "unknown"
        key = f"auth_rate:{action}:{client_ip}"
        r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        current = await r.incr(key)
        if current == 1:
            await r.expire(key, window)
        await r.close()
        if current > limit:
            raise HTTPException(status_code=429, detail="Juda ko'p urinish. Keyinroq qayta urinib ko'ring.")
    except HTTPException:
        raise
    except Exception:
        pass


@router.post("/register", response_model=SuccessResponse[TokenResponse])
async def register(request: Request, data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    await _check_rate_limit(request, "register", limit=5, window=3600)
    service = AuthService(db)
    tokens = await service.register(data)
    return SuccessResponse(data=tokens, message="Registration successful")


@router.post("/login", response_model=SuccessResponse[TokenResponse])
async def login(request: Request, data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and receive tokens."""
    await _check_rate_limit(request, "login", limit=10, window=300)
    service = AuthService(db)
    tokens = await service.login(data)
    return SuccessResponse(data=tokens)


@router.post("/refresh", response_model=SuccessResponse[TokenResponse])
async def refresh(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token."""
    service = AuthService(db)
    tokens = await service.refresh(data.refresh_token)
    return SuccessResponse(data=tokens)


@router.get("/me", response_model=SuccessResponse[UserRead])
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    return SuccessResponse(data=UserRead.model_validate(user))


@router.patch("/me", response_model=SuccessResponse[UserRead])
async def update_me(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile."""
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field not in ALLOWED_UPDATE_FIELDS:
            continue
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return SuccessResponse(data=UserRead.model_validate(user))


@router.post("/change-password", response_model=SuccessResponse[dict])
async def change_password(
    data: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change current user's password."""
    service = AuthService(db)
    await service.change_password(user.id, data.current_password, data.new_password)
    return SuccessResponse(data={}, message="Password changed successfully")


@router.post("/logout-all", response_model=SuccessResponse[dict])
async def logout_all(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invalidate all sessions by regenerating token secret."""
    import secrets

    user.api_key = None
    await db.commit()

    try:
        import redis.asyncio as aioredis
        from app.config import settings

        r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        keys = await r.keys(f"session:{user.id}:*")
        if keys:
            await r.delete(*keys)
        await r.close()
    except Exception:
        pass

    service = AuthService(db)
    tokens = service._create_tokens(user.id)
    return SuccessResponse(
        data={
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
        },
        message="All sessions invalidated",
    )


@router.delete("/me", response_model=SuccessResponse[dict])
async def delete_account(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete user account."""
    from datetime import datetime, timezone

    user.is_active = False
    user.is_deleted = True
    user.deleted_at = datetime.now(timezone.utc)
    user.email = f"deleted_{user.id}_{user.email}"
    user.api_key = None
    await db.commit()
    return SuccessResponse(data={"deleted": True}, message="Account deleted")


@router.post("/api-key", response_model=SuccessResponse[dict])
async def generate_api_key(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a new API key for the current user."""
    service = AuthService(db)
    api_key = await service.generate_user_api_key(user.id)
    return SuccessResponse(data={"api_key": api_key})


@router.post("/telegram-link-token", response_model=SuccessResponse[dict])
async def create_telegram_link_token(
    user: User = Depends(get_current_user),
):
    """Generate a one-time token for linking Telegram via bot deep link."""
    import secrets
    import redis.asyncio as aioredis
    from app.config import settings

    if user.telegram_id:
        raise HTTPException(status_code=400, detail="Telegram allaqachon ulangan")

    token = secrets.token_urlsafe(32)
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    await r.setex(f"tg_link:{token}", 600, str(user.id))
    await r.close()

    bot_username = settings.TELEGRAM_BOT_USERNAME
    deep_link = f"https://t.me/{bot_username}?start=link_{token}"
    return SuccessResponse(data={"token": token, "deep_link": deep_link})


@router.post("/telegram-unlink", response_model=SuccessResponse[dict])
async def unlink_telegram(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove Telegram link from the current user."""
    if not user.telegram_id:
        raise HTTPException(status_code=400, detail="Telegram ulanmagan")

    user.telegram_id = None
    user.telegram_username = None
    await db.commit()
    return SuccessResponse(data={"unlinked": True}, message="Telegram uzildi")
