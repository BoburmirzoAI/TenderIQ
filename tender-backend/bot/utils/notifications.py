"""Bot notification sending utilities."""

import logging
from typing import Optional

from aiogram import Bot
from sqlalchemy import select

from app.database import async_session
from app.models.auth.user import User

logger = logging.getLogger(__name__)


async def send_to_user(bot: Bot, chat_id: str, text: str, **kwargs) -> bool:
    """Send a message to a single user."""
    try:
        await bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML", **kwargs)
        return True
    except Exception as e:
        logger.warning("Failed to send to %s: %s", chat_id, str(e))
        return False


async def send_to_many(bot: Bot, chat_ids: list[str], text: str) -> int:
    """Send a message to multiple users, returning success count."""
    sent = 0
    for chat_id in chat_ids:
        if await send_to_user(bot, chat_id, text):
            sent += 1
    return sent


async def notify_user_by_id(bot: Bot, user_id: int, text: str) -> bool:
    """Send notification to a user by their DB id (looks up telegram_id)."""
    async with async_session() as db:
        user = (await db.execute(
            select(User).where(
                User.id == user_id,
                User.telegram_id.isnot(None),
                User.notify_telegram.is_(True),
            )
        )).scalar_one_or_none()

        if not user:
            return False

        return await send_to_user(bot, user.telegram_id, text)


async def broadcast_to_all(bot: Bot, text: str) -> int:
    """Broadcast a message to all users with Telegram linked."""
    async with async_session() as db:
        result = await db.execute(
            select(User.telegram_id).where(
                User.telegram_id.isnot(None),
                User.is_active.is_(True),
                User.notify_telegram.is_(True),
            )
        )
        chat_ids = [row[0] for row in result.all()]

    return await send_to_many(bot, chat_ids, text)


async def edit_message_safe(
    bot: Bot,
    chat_id: str,
    message_id: int,
    text: str,
    reply_markup: Optional[object] = None,
) -> bool:
    """Edit a message, ignoring errors if message was deleted."""
    try:
        await bot.edit_message_text(
            chat_id=chat_id,
            message_id=message_id,
            text=text,
            parse_mode="HTML",
            reply_markup=reply_markup,
        )
        return True
    except Exception as e:
        logger.warning("Failed to edit message %d: %s", message_id, str(e))
        return False
