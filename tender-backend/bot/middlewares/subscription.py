"""Bot subscription middleware — injects user plan into handler data."""

import logging
from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware
from aiogram.types import TelegramObject
from sqlalchemy import select

from app.database import async_session
from app.models.subscription import Subscription
from app.models.user import User

logger = logging.getLogger(__name__)


class SubscriptionMiddleware(BaseMiddleware):
    """Resolve active subscription plan for the user."""

    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        db_user: User | None = data.get("db_user")
        if db_user:
            if db_user.is_admin or db_user.is_superadmin:
                data["user_plan"] = "business"
            else:
                async with async_session() as db:
                    result = await db.execute(
                        select(Subscription)
                        .where(
                            Subscription.user_id == db_user.id,
                            Subscription.is_active.is_(True),
                        )
                        .order_by(Subscription.created_at.desc())
                        .limit(1)
                    )
                    sub = result.scalar_one_or_none()
                    data["user_plan"] = sub.plan if sub else "free"
        else:
            data["user_plan"] = "free"

        return await handler(event, data)
