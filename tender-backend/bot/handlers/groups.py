"""Group event handlers — track when bot is added/removed from groups."""

import logging

from aiogram import F, Router
from aiogram.types import ChatMemberUpdated
from sqlalchemy import select

from app.database import async_session
from app.models.communication.bot_group import BotGroup

router = Router()
logger = logging.getLogger(__name__)


@router.my_chat_member()
async def on_chat_member_update(event: ChatMemberUpdated) -> None:
    """Track when bot is added to or removed from a group/channel."""
    chat = event.chat

    if chat.type not in ("group", "supergroup", "channel"):
        return

    new_status = event.new_chat_member.status
    added_by = event.from_user

    async with async_session() as db:
        existing = (await db.execute(
            select(BotGroup).where(BotGroup.chat_id == chat.id)
        )).scalar_one_or_none()

        if new_status in ("member", "administrator"):
            if existing:
                existing.is_active = True
                existing.title = chat.title
                existing.chat_type = chat.type
                existing.username = chat.username
                if added_by:
                    existing.added_by_id = added_by.id
                    existing.added_by_name = added_by.full_name
            else:
                group = BotGroup(
                    chat_id=chat.id,
                    title=chat.title,
                    chat_type=chat.type,
                    username=chat.username,
                    added_by_id=added_by.id if added_by else None,
                    added_by_name=added_by.full_name if added_by else None,
                    is_active=True,
                )
                db.add(group)

            await db.commit()
            logger.info("Bot added to %s: %s (%d)", chat.type, chat.title, chat.id)

            try:
                await event.bot.send_message(
                    chat_id=chat.id,
                    text=(
                        "<b>👋 Salom! TenderIQ bot guruhga qo'shildi.</b>\n\n"
                        "Bu guruhga tender yangiliklari va tahlillari yuboriladi.\n"
                        "Admin panel orqali xabar yuborish mumkin.\n\n"
                        "Bot buyruqlari: /help"
                    ),
                    parse_mode="HTML",
                )
            except Exception:
                pass

        elif new_status in ("left", "kicked"):
            if existing:
                existing.is_active = False
                await db.commit()
            logger.info("Bot removed from %s: %s (%d)", chat.type, chat.title, chat.id)
