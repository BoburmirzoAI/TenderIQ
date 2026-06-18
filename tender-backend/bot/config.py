"""Bot-specific configuration."""

from app.config import settings

BOT_TOKEN = settings.TELEGRAM_BOT_TOKEN
WEBHOOK_URL = settings.TELEGRAM_WEBHOOK_URL
DATABASE_URL = settings.DATABASE_URL
REDIS_URL = settings.REDIS_URL
