"""Notification service for Telegram, email, and in-app notifications."""

import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from jinja2 import Environment, FileSystemLoader
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.constants import NotificationType
from app.repositories.user_repo import UserRepository

logger = logging.getLogger(__name__)

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"
_jinja_env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)), autoescape=True)


class NotificationService:
    """Sends notifications via Telegram, email, and in-app channels."""

    def __init__(self, session: Optional[AsyncSession] = None) -> None:
        self.session = session

    def _render_template(self, template_name: str, **ctx: Any) -> str:
        ctx.setdefault("year", datetime.now().year)
        ctx.setdefault("app_url", settings.FRONTEND_URL if hasattr(settings, "FRONTEND_URL") else "https://tenderiq.uz")
        template = _jinja_env.get_template(template_name)
        return template.render(**ctx)

    async def send_telegram(self, chat_id: str, message: str) -> bool:
        """Send a message via Telegram Bot API."""
        import httpx

        if not settings.TELEGRAM_BOT_TOKEN:
            logger.warning("Telegram bot token not configured")
            return False

        url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=10)
                if response.status_code == 200:
                    return True
                logger.error("Telegram send failed: %s", response.text)
                return False
        except httpx.HTTPError as e:
            logger.error("Telegram HTTP error: %s", str(e))
            return False

    async def send_telegram_with_buttons(self, chat_id: str, message: str, tender_id: int) -> bool:
        """Send a Telegram message with inline action buttons."""
        import httpx

        if not settings.TELEGRAM_BOT_TOKEN:
            logger.warning("Telegram bot token not configured")
            return False

        url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
            "reply_markup": {
                "inline_keyboard": [
                    [
                        {"text": "📋 Batafsil", "callback_data": f"td_{tender_id}"},
                        {"text": "❤️ Saqlash", "callback_data": f"save_{tender_id}"},
                    ],
                    [
                        {"text": "👥 Raqobatchilar", "callback_data": f"comp_{tender_id}"},
                        {"text": "💰 Narx tahlili", "callback_data": f"pricing_{tender_id}"},
                    ],
                ],
            },
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=10)
                if response.status_code == 200:
                    return True
                logger.error("Telegram send with buttons failed: %s", response.text)
                return False
        except httpx.HTTPError as e:
            logger.error("Telegram HTTP error: %s", str(e))
            return False

    async def send_email(self, to_email: str, subject: str, body: str) -> bool:
        """Send an email notification."""
        import aiosmtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        if not settings.SMTP_USER:
            logger.warning("SMTP not configured")
            return False

        msg = MIMEMultipart()
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))

        try:
            await aiosmtplib.send(
                msg,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USER,
                password=settings.SMTP_PASSWORD,
                use_tls=True,
            )
            return True
        except Exception as e:
            logger.error("Email send failed: %s", str(e))
            return False

    async def send_match_email(self, user_email: str, user_name: str, tender: dict) -> bool:
        """Send match notification email."""
        html = self._render_template(
            "email/match_notification.html",
            user_name=user_name,
            tender_title=tender.get("title", ""),
            tender_id=tender.get("id", ""),
            score=tender.get("score", 0),
            amount=tender.get("amount", 0),
            organization=tender.get("organization", "N/A"),
            deadline=tender.get("deadline", "N/A"),
        )
        return await self.send_email(user_email, f"Yangi mos tender: {tender.get('title', '')[:60]}", html)

    async def send_deadline_email(self, user_email: str, user_name: str, tenders: list[dict], days_left: int) -> bool:
        """Send deadline reminder email."""
        html = self._render_template(
            "email/deadline_reminder.html",
            user_name=user_name,
            tenders=tenders,
            days_left=days_left,
        )
        count = len(tenders)
        subject = f"{count} ta tender muddati {days_left} kunda tugaydi"
        return await self.send_email(user_email, subject, html)

    async def send_digest_email(self, user_email: str, user_name: str, matches: list[dict], stats: dict) -> bool:
        """Send weekly digest email."""
        html = self._render_template(
            "email/weekly_digest.html",
            user_name=user_name,
            matches=matches,
            stats=stats,
        )
        return await self.send_email(user_email, f"TenderIQ haftalik xulosa — {len(matches)} ta mos tender", html)

    async def send_daily_digest(self, user_id: int, matches: list[dict]) -> bool:
        """Send daily digest of new matched tenders."""
        if not self.session:
            return False

        user_repo = UserRepository(self.session)
        user = await user_repo.get_by_id(user_id)
        if not user:
            return False

        message_lines = [f"<b>Kunlik tender xulosa</b>\n"]
        message_lines.append(f"Bugun {len(matches)} ta mos tender topildi:\n")

        for match in matches[:10]:
            message_lines.append(
                f"• <b>{match.get('title', 'N/A')}</b>\n"
                f"  Bal: {match.get('score', 0):.0f}% | "
                f"Summa: {match.get('amount', 'N/A')} UZS\n"
            )

        message = "\n".join(message_lines)

        sent = False
        if user.notify_telegram and user.telegram_id:
            sent = await self.send_telegram(user.telegram_id, message)

        if user.notify_email and user.email:
            email_sent = await self.send_digest_email(
                user.email,
                user.full_name,
                matches,
                {"new_tenders": len(matches), "matched": len(matches), "applications": 0, "won": 0},
            )
            sent = sent or email_sent

        return sent
