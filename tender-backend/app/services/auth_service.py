"""Authentication service handling registration, login, and token management."""

import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import SubscriptionPlan
from app.exceptions import ConflictException, NotFoundException, UnauthorizedException
from app.repositories.subscription_repo import SubscriptionRepository
from app.repositories.user_repo import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_api_key,
    hash_password,
    verify_password,
)

logger = logging.getLogger(__name__)


class AuthService:
    """Handles user authentication workflows."""

    def __init__(self, session: AsyncSession) -> None:
        self.user_repo = UserRepository(session)
        self.sub_repo = SubscriptionRepository(session)
        self.session = session

    async def register(self, data: RegisterRequest) -> TokenResponse:
        """Register a new user and return tokens."""
        if await self.user_repo.email_exists(data.email):
            raise ConflictException("Email already registered")

        user = await self.user_repo.create(
            {
                "email": data.email,
                "hashed_password": hash_password(data.password),
                "full_name": data.full_name,
                "phone": data.phone,
            }
        )

        await self.sub_repo.create(
            {
                "user_id": user.id,
                "plan": SubscriptionPlan.FREE.value,
                "is_active": True,
                "starts_at": datetime.now(timezone.utc),
            }
        )

        logger.info("User registered: %s", user.email)
        return self._create_tokens(user.id)

    async def login(self, data: LoginRequest) -> TokenResponse:
        """Authenticate user and return tokens."""
        user = await self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")
        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")

        logger.info("User logged in: %s", user.email)
        return self._create_tokens(user.id)

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """Issue new tokens from a valid refresh token."""
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid refresh token")

        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Invalid token payload")

        user = await self.user_repo.get_by_id(int(user_id))
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive")

        return self._create_tokens(user.id)

    async def change_password(
        self, user_id: int, current_password: str, new_password: str
    ) -> None:
        """Change user password after verifying the current one."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User")

        if not verify_password(current_password, user.hashed_password):
            raise UnauthorizedException("Current password is incorrect")

        await self.user_repo.update(user_id, {"hashed_password": hash_password(new_password)})
        logger.info("Password changed for user %d", user_id)

    async def generate_user_api_key(self, user_id: int) -> str:
        """Generate and store a new API key (hashed) for a user."""
        raw_key, hashed_key = generate_api_key()
        await self.user_repo.update(user_id, {"api_key": hashed_key})
        logger.info("API key generated for user %d", user_id)
        return raw_key

    def _create_tokens(self, user_id: int) -> TokenResponse:
        """Create access and refresh token pair."""
        token_data = {"sub": str(user_id)}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            token_type="bearer",
            expires_in=60 * 60,
        )
