"""User repository for user-specific queries."""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for user data access."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> Optional[User]:
        """Find user by email address."""
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_telegram_id(self, telegram_id: str) -> Optional[User]:
        """Find user by Telegram ID."""
        result = await self.session.execute(
            select(User).where(User.telegram_id == telegram_id)
        )
        return result.scalar_one_or_none()

    async def get_by_api_key(self, api_key: str) -> Optional[User]:
        """Find user by API key."""
        result = await self.session.execute(select(User).where(User.api_key == api_key))
        return result.scalar_one_or_none()

    async def get_active_users(self, skip: int = 0, limit: int = 20) -> list[User]:
        """Fetch active, non-deleted users."""
        result = await self.session.execute(
            select(User)
            .where(User.is_active.is_(True), User.is_deleted.is_(False))
            .offset(skip)
            .limit(limit)
            .order_by(User.id.desc())
        )
        return list(result.scalars().all())

    async def get_users_with_telegram(self) -> list[User]:
        """Fetch all users who have linked Telegram."""
        result = await self.session.execute(
            select(User).where(
                User.telegram_id.isnot(None),
                User.is_active.is_(True),
                User.is_deleted.is_(False),
            )
        )
        return list(result.scalars().all())

    async def email_exists(self, email: str) -> bool:
        """Check if email is already registered."""
        user = await self.get_by_email(email)
        return user is not None
