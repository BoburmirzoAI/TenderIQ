"""Authentication endpoints."""

import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.auth.user import User
from app.repositories.auth.user_repo import UserRepository
from app.schemas.auth.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UzexLoginRequest,
    UzexRegisterRequest,
    VerifyEmailRequest,
)
from app.schemas.base import SuccessResponse
from app.schemas.auth.user import UserRead, UserUpdate
from app.services.auth.auth_service import AuthService
from app.services.auth.cache_service import cache_service
from app.services.communication.notification_service import NotificationService

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_UPDATE_FIELDS = {
    "full_name", "phone", "telegram_username", "language",
    "avatar_url", "notify_new_tenders", "notify_match",
    "notify_deadline", "notify_results", "notify_email",
    "notify_telegram", "theme",
}


async def _check_rate_limit(request: Request, action: str, limit: int, window: int) -> None:
    """Check Redis rate limit per IP. Raises 429 if exceeded.

    Graceful degradation: if Redis is unavailable, log and allow the request.
    bcrypt + JWT already protect against brute-force without rate limiting.
    """
    client_ip = request.client.host if request.client else "unknown"
    key = f"auth_rate:{action}:{client_ip}"
    try:
        current = await cache_service.increment(key)
        if current == 1:
            await cache_service.expire(key, window)
        if current > limit:
            raise HTTPException(status_code=429, detail="Juda ko'p urinish. Keyinroq qayta urinib ko'ring.")
    except HTTPException:
        raise
    except Exception:
        logger.warning("Rate limit unavailable for %s:%s — allowing request", action, client_ip)


@router.post("/register", response_model=SuccessResponse[TokenResponse])
async def register(request: Request, data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    await _check_rate_limit(request, "register", limit=5, window=3600)
    service = AuthService(db)
    tokens = await service.register(data)

    try:
        from app.config import settings
        from app.utils.security import decode_token
        payload = decode_token(tokens.access_token)
        user_id = payload.get("sub")
        verify_token = secrets.token_urlsafe(32)
        await cache_service.set(f"email_verify:{verify_token}", str(user_id), expire=86400)
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={verify_token}"
        notif = NotificationService()
        await notif.send_email_verification(data.email, data.full_name, verify_url)
    except Exception as exc:
        logger.warning("Failed to send verification email to %s: %s", data.email, exc)

    return SuccessResponse(data=tokens, message="Registration successful")


@router.post("/login", response_model=SuccessResponse[TokenResponse])
async def login(request: Request, data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and receive tokens."""
    await _check_rate_limit(request, "login", limit=10, window=300)
    service = AuthService(db)
    tokens = await service.login(data)
    return SuccessResponse(data=tokens)


@router.post("/refresh", response_model=SuccessResponse[TokenResponse])
async def refresh(request: Request, data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token."""
    await _check_rate_limit(request, "refresh", limit=30, window=300)
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
    """Invalidate all sessions by bumping token_version. All existing tokens become invalid."""
    new_version = (user.token_version or 1) + 1
    user.token_version = new_version
    user.api_key = None
    await db.commit()

    try:
        redis_client = await cache_service._get_client()
        keys = await redis_client.keys(f"session:{user.id}:*")
        if keys:
            await redis_client.delete(*keys)
    except Exception:
        # Redis unavailable — logout still completes via token_version; old tokens rejected on next request
        logger.warning("Redis session cleanup skipped for user %d — Redis unavailable", user.id)

    service = AuthService(db)
    tokens = service._create_tokens(user.id, new_version)
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
    from app.config import settings

    if user.telegram_id:
        raise HTTPException(status_code=400, detail="Telegram allaqachon ulangan")

    token = secrets.token_urlsafe(32)
    await cache_service.set(f"tg_link:{token}", str(user.id), expire=600)

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


@router.post("/forgot-password", response_model=SuccessResponse[dict])
async def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Send password reset link to user email."""
    await _check_rate_limit(request, "forgot_password", limit=3, window=900)

    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(data.email)

    # Always return success to prevent email enumeration
    if not user or not user.is_active:
        return SuccessResponse(data={"sent": True}, message="Agar email mavjud bo'lsa, xat yuborildi")

    token = secrets.token_urlsafe(32)
    await cache_service.set(f"pwd_reset:{token}", str(user.id), expire=900)

    from app.config import settings
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    notif = NotificationService()
    await notif.send_password_reset_email(user.email, user.full_name, reset_url)

    logger.info("Password reset requested for user %d", user.id)
    return SuccessResponse(data={"sent": True}, message="Agar email mavjud bo'lsa, xat yuborildi")


@router.post("/reset-password", response_model=SuccessResponse[dict])
async def reset_password(
    request: Request,
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Reset password using token from email."""
    await _check_rate_limit(request, "reset_password", limit=10, window=300)
    user_id_str = await cache_service.get(f"pwd_reset:{data.token}")
    if not user_id_str:
        raise HTTPException(status_code=400, detail="Token yaroqsiz yoki muddati o'tgan")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(int(user_id_str))
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Foydalanuvchi topilmadi")

    from app.utils.security import hash_password
    user.hashed_password = hash_password(data.new_password)
    await db.commit()

    await cache_service.delete(f"pwd_reset:{data.token}")
    logger.info("Password reset completed for user %d", user.id)
    return SuccessResponse(data={"reset": True}, message="Parol muvaffaqiyatli yangilandi")


@router.post("/send-verification", response_model=SuccessResponse[dict])
async def send_email_verification(
    request: Request,
    user: User = Depends(get_current_user),
):
    """Send email verification link to current user."""
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email allaqachon tasdiqlangan")

    await _check_rate_limit(request, "send_verification", limit=3, window=3600)

    token = secrets.token_urlsafe(32)
    await cache_service.set(f"email_verify:{token}", str(user.id), expire=86400)

    from app.config import settings
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    notif = NotificationService()
    await notif.send_email_verification(user.email, user.full_name, verify_url)

    return SuccessResponse(data={"sent": True}, message="Tasdiqlash xati yuborildi")


@router.post("/verify-email", response_model=SuccessResponse[dict])
async def verify_email(
    request: Request,
    data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify email address using token from email link."""
    await _check_rate_limit(request, "verify_email", limit=10, window=300)
    user_id_str = await cache_service.get(f"email_verify:{data.token}")
    if not user_id_str:
        raise HTTPException(status_code=400, detail="Token yaroqsiz yoki muddati o'tgan")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(int(user_id_str))
    if not user:
        raise HTTPException(status_code=400, detail="Foydalanuvchi topilmadi")

    user.is_verified = True
    await db.commit()

    await cache_service.delete(f"email_verify:{data.token}")
    logger.info("Email verified for user %d", user.id)
    return SuccessResponse(data={"verified": True}, message="Email muvaffaqiyatli tasdiqlandi")


@router.get("/mode")
async def get_auth_mode():
    """Return current authentication mode (public, no auth required)."""
    from app.api.v1.admin.system.settings import _FEATURE_FLAGS
    uzex_enabled = _FEATURE_FLAGS.get("uzex_auth", False)
    return SuccessResponse(data={"mode": "uzex" if uzex_enabled else "basic"})


def _require_uzex_enabled() -> None:
    """Raise 403 if UZEX auth mode is not enabled."""
    from app.api.v1.admin.system.settings import _FEATURE_FLAGS
    if not _FEATURE_FLAGS.get("uzex_auth", False):
        raise HTTPException(status_code=403, detail="UZEX autentifikatsiya rejimi yoqilmagan")


@router.post("/uzex-register", response_model=SuccessResponse[TokenResponse])
async def uzex_register(request: Request, data: UzexRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register via UZEX-style flow with organization details."""
    _require_uzex_enabled()
    await _check_rate_limit(request, "uzex_register", limit=5, window=3600)

    user_repo = UserRepository(db)

    if await user_repo.email_exists(data.email):
        raise HTTPException(status_code=409, detail="Bu email allaqachon ro'yxatdan o'tgan")
    if await user_repo.inn_exists(data.inn):
        raise HTTPException(status_code=409, detail="Bu INN allaqachon ro'yxatdan o'tgan")
    if data.eri_key_serial and await user_repo.eri_key_exists(data.eri_key_serial):
        raise HTTPException(status_code=409, detail="Bu ERI kalit allaqachon ro'yxatdan o'tgan")

    from app.utils.security import hash_password
    user = await user_repo.create({
        "email": data.email,
        "hashed_password": hash_password(data.password),
        "full_name": data.director_name,
        "phone": data.phone,
        "auth_type": "uzex",
        "inn": data.inn,
        "mfo": data.mfo,
        "organization_name": data.organization_name,
        "account_number": data.account_number,
        "region": data.region,
        "district": data.district,
        "address": data.address,
        "director_name": data.director_name,
        "eri_key_serial": data.eri_key_serial,
        "usb_token_id": data.usb_token_id,
    })

    from app.repositories.finance.subscription_repo import SubscriptionRepository
    from app.constants import SubscriptionPlan
    from datetime import datetime, timezone
    sub_repo = SubscriptionRepository(db)
    await sub_repo.create({
        "user_id": user.id,
        "plan": SubscriptionPlan.FREE.value,
        "is_active": True,
        "starts_at": datetime.now(timezone.utc),
    })

    try:
        from app.config import settings as app_settings
        from app.utils.security import decode_token
        service = AuthService(db)
        tokens = service._create_tokens(user.id, user.token_version)
        payload = decode_token(tokens.access_token)
        user_id = payload.get("sub")
        verify_token = secrets.token_urlsafe(32)
        await cache_service.set(f"email_verify:{verify_token}", str(user_id), expire=86400)
        verify_url = f"{app_settings.FRONTEND_URL}/verify-email?token={verify_token}"
        notif = NotificationService()
        await notif.send_email_verification(data.email, data.director_name, verify_url)
    except Exception as exc:
        logger.warning("Failed to send verification email to %s: %s", data.email, exc)

    logger.info("UZEX user registered: %s (INN: %s)", user.email, data.inn)
    service = AuthService(db)
    return SuccessResponse(data=service._create_tokens(user.id, user.token_version), message="Ro'yxatdan o'tish muvaffaqiyatli")


@router.post("/uzex-login", response_model=SuccessResponse[TokenResponse])
async def uzex_login(request: Request, data: UzexLoginRequest, db: AsyncSession = Depends(get_db)):
    """Login via UZEX-style: INN+password or ERI key / USB token."""
    _require_uzex_enabled()
    await _check_rate_limit(request, "uzex_login", limit=10, window=300)

    user_repo = UserRepository(db)
    user: User | None = None

    if data.eri_key_serial:
        user = await user_repo.get_by_eri_key(data.eri_key_serial)
        if not user:
            raise HTTPException(status_code=401, detail="ERI kalit topilmadi")
    elif data.usb_token_id:
        user = await user_repo.get_by_usb_token(data.usb_token_id)
        if not user:
            raise HTTPException(status_code=401, detail="USB token topilmadi")
    elif data.inn and data.password:
        user = await user_repo.get_by_inn(data.inn)
        if not user:
            raise HTTPException(status_code=401, detail="INN yoki parol noto'g'ri")
        from app.utils.security import verify_password
        if not verify_password(data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="INN yoki parol noto'g'ri")
    else:
        raise HTTPException(status_code=400, detail="INN+parol, ERI kalit yoki USB token kiriting")

    if not user.is_active:
        raise HTTPException(status_code=401, detail="Hisob faol emas")

    logger.info("UZEX user logged in: %s (INN: %s)", user.email, user.inn)
    service = AuthService(db)
    return SuccessResponse(data=service._create_tokens(user.id, user.token_version))
