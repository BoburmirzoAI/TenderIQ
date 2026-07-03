"""Telegram bot entry point."""

import asyncio
import logging
import sys

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import BotCommand, MenuButtonWebApp, WebAppInfo

from bot.config import BOT_TOKEN
from bot.handlers import admin, analytics, documents, groups, profile, start, subscription, tenders
from bot.middlewares.auth import AuthMiddleware
from bot.middlewares.subscription import SubscriptionMiddleware

logger = logging.getLogger(__name__)

PLACEHOLDER_TOKENS = {"", "your-telegram-bot-token"}


async def main() -> None:
    """Initialize and start the bot."""
    if BOT_TOKEN in PLACEHOLDER_TOKENS:
        logger.error(
            "TELEGRAM_BOT_TOKEN is not configured. "
            "Get a token from @BotFather on Telegram and set it in .env"
        )
        sys.exit(1)

    bot = Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    storage = MemoryStorage()
    dp = Dispatcher(storage=storage)

    dp.message.middleware(AuthMiddleware())
    dp.callback_query.middleware(AuthMiddleware())
    dp.message.middleware(SubscriptionMiddleware())
    dp.callback_query.middleware(SubscriptionMiddleware())

    dp.include_router(start.router)
    dp.include_router(admin.router)
    dp.include_router(profile.router)
    dp.include_router(tenders.router)
    dp.include_router(analytics.router)
    dp.include_router(documents.router)
    dp.include_router(subscription.router)
    dp.include_router(groups.router)

    from app.config import settings

    try:
        await bot.set_my_commands([
            BotCommand(command="start", description="Bosh menyu"),
            BotCommand(command="tenders", description="Faol tenderlar"),
            BotCommand(command="search", description="Tender qidirish"),
            BotCommand(command="saved", description="Saqlangan tenderlar"),
            BotCommand(command="stats", description="Statistika"),
            BotCommand(command="map", description="Tender xaritasi"),
            BotCommand(command="profile", description="Kompaniya profili"),
            BotCommand(command="plan", description="Obuna rejasi"),
            BotCommand(command="settings", description="Sozlamalar"),
            BotCommand(command="link", description="Akkauntni ulash"),
            BotCommand(command="help", description="Yordam"),
        ])

        if settings.FRONTEND_URL.startswith("https://"):
            await bot.set_chat_menu_button(
                menu_button=MenuButtonWebApp(
                    text="🌐 TenderIQ",
                    web_app=WebAppInfo(url=settings.FRONTEND_URL),
                )
            )
    except Exception as e:
        logger.warning("Telegram API ulanishda xato (bot ishlashda davom etadi): %s", e)

    logger.info("TenderIQ Bot starting...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
