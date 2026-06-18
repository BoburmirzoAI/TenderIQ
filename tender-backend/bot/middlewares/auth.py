"""Bot authentication middleware — links Telegram user to DB user."""

import logging
from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, Message, CallbackQuery
from sqlalchemy import select

from app.database import async_session
from app.models.user import User

logger = logging.getLogger(__name__)


class AuthMiddleware(BaseMiddleware):
    """Resolve Telegram user → DB user. Inject db_user into handler data."""

    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        tg_user = None
        if isinstance(event, (Message, CallbackQuery)) and event.from_user:
            tg_user = event.from_user

        if not tg_user:
            return await handler(event, data)

        tg_id = str(tg_user.id)

        async with async_session() as db:
            result = await db.execute(
                select(User).where(User.telegram_id == tg_id, User.is_deleted.is_(False))
            )
            db_user = result.scalar_one_or_none()

            if db_user and tg_user.username and db_user.telegram_username != tg_user.username:
                db_user.telegram_username = tg_user.username
                await db.commit()

            data["db_user"] = db_user
            data["db"] = db
            data["telegram_id"] = tg_id

            return await handler(event, data)
