"""Subscription repository for plan management."""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.finance.subscription import Subscription
from app.repositories.base import BaseRepository


class SubscriptionRepository(BaseRepository[Subscription]):
    """Repository for subscription data access."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Subscription, session)

    async def get_active_for_user(self, user_id: int) -> Optional[Subscription]:
        """Find the current active subscription for a user."""
        result = await self.session.execute(
            select(Subscription)
            .where(Subscription.user_id == user_id, Subscription.is_active.is_(True))
            .order_by(Subscription.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_all_for_user(self, user_id: int) -> list[Subscription]:
        """Fetch subscription history for a user."""
        result = await self.session.execute(
            select(Subscription)
            .where(Subscription.user_id == user_id)
            .order_by(Subscription.created_at.desc())
        )
        return list(result.scalars().all())

    async def deactivate_all_for_user(self, user_id: int) -> None:
        """Deactivate all subscriptions for a user before activating a new one."""
        result = await self.session.execute(
            select(Subscription).where(
                Subscription.user_id == user_id, Subscription.is_active.is_(True)
            )
        )
        for sub in result.scalars().all():
            sub.is_active = False
        await self.session.commit()

    async def count_by_plan(self) -> dict[str, int]:
        """Count active subscriptions grouped by plan."""
        from sqlalchemy import func

        result = await self.session.execute(
            select(Subscription.plan, func.count())
            .where(Subscription.is_active.is_(True))
            .group_by(Subscription.plan)
        )
        return dict(result.all())
