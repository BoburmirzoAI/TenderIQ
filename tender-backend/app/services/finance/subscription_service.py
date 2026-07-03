"""Subscription service for plan management and usage tracking."""

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import PLAN_LIMITS, PLAN_PRICES_UZS, SubscriptionPlan
from app.exceptions import NotFoundException, PlanLimitException
from app.repositories.finance.subscription_repo import SubscriptionRepository
from app.repositories.tenders.tender_match_repo import TenderMatchRepository
from app.schemas.finance.subscription import PlanInfo, SubscriptionRead, UsageStats

logger = logging.getLogger(__name__)


class SubscriptionService:
    """Handles plan checks, usage limits, and subscription activation."""

    def __init__(self, session: AsyncSession) -> None:
        self.sub_repo = SubscriptionRepository(session)
        self.match_repo = TenderMatchRepository(session)

    async def get_current(self, user_id: int) -> SubscriptionRead:
        """Get the current active subscription."""
        sub = await self.sub_repo.get_active_for_user(user_id)
        if not sub:
            return SubscriptionRead(
                id=0,
                plan="free",
                is_active=True,
                starts_at=datetime.now(timezone.utc),
                expires_at=None,
                daily_requests_used=0,
                is_expired=False,
            )
        return SubscriptionRead.model_validate(sub)

    async def check_plan(self, user_id: int, feature: str) -> bool:
        """Check if user's plan includes a specific feature."""
        sub = await self.sub_repo.get_active_for_user(user_id)
        if not sub:
            return False

        plan = SubscriptionPlan(sub.plan)
        limits = PLAN_LIMITS[plan]
        return bool(limits.get(feature, False))

    async def check_limit(self, user_id: int) -> bool:
        """Check if user has remaining daily requests."""
        sub = await self.sub_repo.get_active_for_user(user_id)
        if not sub:
            raise PlanLimitException("API access")

        plan = SubscriptionPlan(sub.plan)
        limit = PLAN_LIMITS[plan]["daily_requests"]

        today = date.today().isoformat()
        if sub.last_request_date != today:
            sub.daily_requests_used = 0
            sub.last_request_date = today
            await self.sub_repo.session.commit()

        return sub.daily_requests_used < limit

    async def increment_usage(self, user_id: int) -> None:
        """Increment the daily request counter."""
        sub = await self.sub_repo.get_active_for_user(user_id)
        if not sub:
            return

        today = date.today().isoformat()
        if sub.last_request_date != today:
            sub.daily_requests_used = 1
            sub.last_request_date = today
        else:
            sub.daily_requests_used += 1
        await self.sub_repo.session.commit()

    async def activate(self, user_id: int, plan: SubscriptionPlan) -> SubscriptionRead:
        """Activate a new subscription plan for a user."""
        await self.sub_repo.deactivate_all_for_user(user_id)

        now = datetime.now(timezone.utc)
        expires = now + timedelta(days=30) if plan != SubscriptionPlan.FREE else None

        sub = await self.sub_repo.create(
            {
                "user_id": user_id,
                "plan": plan.value,
                "is_active": True,
                "starts_at": now,
                "expires_at": expires,
            }
        )

        logger.info("Subscription activated: user=%d, plan=%s", user_id, plan.value)
        return SubscriptionRead.model_validate(sub)

    async def get_usage_stats(self, user_id: int) -> UsageStats:
        """Get current usage statistics."""
        sub = await self.sub_repo.get_active_for_user(user_id)

        if not sub:
            limits = PLAN_LIMITS[SubscriptionPlan.FREE]
            return UsageStats(
                plan="free",
                daily_requests_used=0,
                daily_requests_limit=limits["daily_requests"],
                saved_tenders=0,
                max_saved_tenders=limits["max_saved_tenders"],
                days_remaining=None,
            )

        plan = SubscriptionPlan(sub.plan)
        limits = PLAN_LIMITS[plan]

        days_remaining = None
        if sub.expires_at:
            delta = sub.expires_at - datetime.now(timezone.utc)
            days_remaining = max(0, delta.days)

        return UsageStats(
            plan=sub.plan,
            daily_requests_used=sub.daily_requests_used,
            daily_requests_limit=limits["daily_requests"],
            saved_tenders=0,
            max_saved_tenders=limits["max_saved_tenders"],
            days_remaining=days_remaining,
        )

    def get_all_plans(self) -> list[PlanInfo]:
        """List all available subscription plans."""
        plans = []
        for plan in SubscriptionPlan:
            limits = PLAN_LIMITS[plan]
            plans.append(
                PlanInfo(
                    name=plan.value,
                    price_uzs=PLAN_PRICES_UZS[plan],
                    daily_requests=limits["daily_requests"],
                    ml_access=limits["ml_access"],
                    api_access=limits["api_access"],
                    document_analysis=limits["document_analysis"],
                    max_saved_tenders=limits["max_saved_tenders"],
                    max_team_members=limits["max_team_members"],
                )
            )
        return plans
