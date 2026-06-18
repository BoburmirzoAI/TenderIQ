"""Celery tasks for sending notifications."""

import asyncio
import logging

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


def _fmt_amount(amount: float | None) -> str:
    if not amount:
        return "N/A"
    if amount >= 1e9:
        return f"{amount / 1e9:.1f} mlrd UZS"
    if amount >= 1e6:
        return f"{amount / 1e6:.1f} mln UZS"
    return f"{amount:,.0f} UZS"


def _fmt_deadline(deadline) -> str:
    if not deadline:
        return "N/A"
    try:
        return deadline.strftime("%d.%m.%Y %H:%M")
    except Exception:
        return str(deadline)


@celery_app.task(name="app.tasks.notification_tasks.send_telegram_notification")
def send_telegram_notification(chat_id: str, message: str):
    """Send a single Telegram notification."""

    async def _send():
        from app.services.notification_service import NotificationService

        service = NotificationService()
        return await service.send_telegram(chat_id, message)

    result = _run_async(_send())
    return {"chat_id": chat_id, "sent": result}


@celery_app.task(name="app.tasks.notification_tasks.send_email_notification")
def send_email_notification(to_email: str, subject: str, body: str):
    """Send a single email notification."""

    async def _send():
        from app.services.notification_service import NotificationService

        service = NotificationService()
        return await service.send_email(to_email, subject, body)

    result = _run_async(_send())
    return {"to_email": to_email, "sent": result}


@celery_app.task(name="app.tasks.notification_tasks.send_match_batch")
def send_match_batch(match_ids: list[int]):
    """Send notifications for a batch of new matches."""

    async def _send_batch():
        from app.database import async_session
        from app.models.notification import Notification
        from app.repositories.tender_match_repo import TenderMatchRepository
        from app.repositories.tender_repo import TenderRepository
        from app.repositories.user_repo import UserRepository
        from app.repositories.company_repo import CompanyRepository
        from app.services.notification_service import NotificationService

        sent = 0
        async with async_session() as session:
            match_repo = TenderMatchRepository(session)
            tender_repo = TenderRepository(session)
            company_repo = CompanyRepository(session)
            user_repo = UserRepository(session)
            notif_service = NotificationService()

            for match_id in match_ids:
                match = await match_repo.get_by_id(match_id)
                if not match or match.is_notified:
                    continue

                tender = await tender_repo.get_by_id(match.tender_id)
                company = await company_repo.get_by_id(match.company_id)
                if not tender or not company:
                    continue

                user = await user_repo.get_by_id(company.user_id)
                if not user:
                    continue

                score_bar = "🟢" if match.score >= 80 else "🟡" if match.score >= 65 else "🔴"
                telegram_message = (
                    f"🔔 <b>Yangi mos tender!</b>\n\n"
                    f"📋 <b>{tender.title[:200]}</b>\n\n"
                    f"🏢 {tender.organization or 'N/A'}\n"
                    f"💰 {_fmt_amount(tender.amount)}\n"
                    f"📍 {tender.region or 'N/A'}\n"
                    f"{score_bar} Moslik: <b>{match.score:.0f}%</b>\n"
                    f"⏰ Muddat: {_fmt_deadline(tender.deadline)}\n"
                )

                notif_title = f"Yangi mos tender: {tender.title[:100]}"
                channel = None

                if user.notify_telegram and user.telegram_id:
                    tg_ok = await notif_service.send_telegram_with_buttons(
                        user.telegram_id, telegram_message, tender.id,
                    )
                    if tg_ok:
                        channel = "telegram"

                if user.notify_email and user.email:
                    tender_data = {
                        "id": tender.id,
                        "title": tender.title[:200],
                        "organization": tender.organization or "N/A",
                        "amount": tender.amount or 0,
                        "score": match.score,
                        "deadline": str(tender.deadline) if tender.deadline else "N/A",
                    }
                    email_ok = await notif_service.send_match_email(user.email, user.full_name, tender_data)
                    if email_ok:
                        channel = channel or "email"

                notification = Notification(
                    user_id=user.id,
                    tender_id=tender.id,
                    type="match",
                    channel=channel or "in_app",
                    title=notif_title,
                    message=telegram_message,
                    is_sent=channel is not None,
                )
                session.add(notification)

                if channel:
                    await match_repo.mark_notified(match_id, channel)
                    sent += 1

            await session.commit()
        return sent

    count = _run_async(_send_batch())
    logger.info("Batch notification: %d/%d sent", count, len(match_ids))
    return {"total": len(match_ids), "sent": count}


@celery_app.task(name="app.tasks.notification_tasks.send_daily_digest_all")
def send_daily_digest_all():
    """Send daily digest to all users with notifications enabled."""

    async def _send():
        from datetime import datetime, timedelta

        from sqlalchemy import select, func
        from app.database import async_session
        from app.models.notification import Notification
        from app.models.tender_match import TenderMatch
        from app.models.tender import Tender
        from app.models.company import Company
        from app.models.user import User
        from app.services.notification_service import NotificationService

        yesterday = datetime.now() - timedelta(days=1)
        sent = 0

        async with async_session() as session:
            result = await session.execute(
                select(User).where(
                    User.is_deleted.is_(False),
                    User.is_active.is_(True),
                    User.telegram_id.isnot(None),
                    User.notify_telegram.is_(True),
                )
            )
            users = result.scalars().all()
            notif_service = NotificationService()

            for user in users:
                company_result = await session.execute(
                    select(Company).where(Company.user_id == user.id)
                )
                company = company_result.scalar_one_or_none()
                if not company:
                    continue

                match_result = await session.execute(
                    select(TenderMatch)
                    .join(Tender, TenderMatch.tender_id == Tender.id)
                    .where(
                        TenderMatch.company_id == company.id,
                        TenderMatch.created_at >= yesterday,
                    )
                    .order_by(TenderMatch.score.desc())
                    .limit(10)
                )
                matches = match_result.scalars().all()

                if not matches:
                    continue

                lines = [
                    f"📊 <b>Kunlik xulosa</b>\n",
                    f"Bugun <b>{len(matches)}</b> ta mos tender topildi:\n",
                ]
                for m in matches:
                    tender_result = await session.execute(
                        select(Tender).where(Tender.id == m.tender_id)
                    )
                    t = tender_result.scalar_one_or_none()
                    if not t:
                        continue
                    score_icon = "🟢" if m.score >= 80 else "🟡"
                    lines.append(
                        f"{score_icon} <b>{t.title[:80]}</b>\n"
                        f"   💰 {_fmt_amount(t.amount)} | ⏰ {_fmt_deadline(t.deadline)}\n"
                    )

                lines.append("\n/tenders — barcha tenderlar")
                message = "\n".join(lines)

                try:
                    ok = await notif_service.send_telegram(user.telegram_id, message)
                    if ok:
                        sent += 1
                        notification = Notification(
                            user_id=user.id,
                            type="digest",
                            channel="telegram",
                            title=f"Kunlik xulosa: {len(matches)} ta mos tender",
                            message=message,
                            is_sent=True,
                        )
                        session.add(notification)
                except Exception as e:
                    logger.warning("Digest failed for user %d: %s", user.id, str(e))

            await session.commit()
        return sent

    count = _run_async(_send())
    logger.info("Daily digest sent to %d users", count)
    return {"sent": count}


@celery_app.task(name="app.tasks.notification_tasks.send_deadline_reminders")
def send_deadline_reminders():
    """Send deadline reminders via Telegram and email."""

    async def _send():
        from datetime import datetime, timedelta

        from sqlalchemy import select
        from app.database import async_session
        from app.models.notification import Notification
        from app.models.tender import Tender
        from app.models.tender_match import TenderMatch
        from app.models.company import Company
        from app.models.user import User
        from app.services.notification_service import NotificationService

        sent = 0
        async with async_session() as session:
            notif_service = NotificationService()

            for days in (1, 3):
                target_date = (datetime.now() + timedelta(days=days)).date()
                result = await session.execute(
                    select(Tender).where(
                        Tender.is_deleted.is_(False),
                        Tender.status == "active",
                        Tender.deadline.isnot(None),
                    )
                )
                tenders = [
                    t for t in result.scalars().all()
                    if t.deadline and t.deadline.date() == target_date
                ]

                if not tenders:
                    continue

                tender_ids = [t.id for t in tenders]

                match_result = await session.execute(
                    select(TenderMatch.company_id).where(
                        TenderMatch.tender_id.in_(tender_ids),
                    ).distinct()
                )
                company_ids = [row[0] for row in match_result.all()]

                for company_id in company_ids:
                    company_result = await session.execute(
                        select(Company).where(Company.id == company_id)
                    )
                    company = company_result.scalar_one_or_none()
                    if not company:
                        continue

                    user_result = await session.execute(
                        select(User).where(User.id == company.user_id)
                    )
                    user = user_result.scalar_one_or_none()
                    if not user or not user.notify_deadline:
                        continue

                    user_match_result = await session.execute(
                        select(TenderMatch.tender_id).where(
                            TenderMatch.company_id == company_id,
                            TenderMatch.tender_id.in_(tender_ids),
                        )
                    )
                    user_tender_ids = {row[0] for row in user_match_result.all()}
                    user_tenders = [t for t in tenders if t.id in user_tender_ids]

                    if not user_tenders:
                        continue

                    emoji = "🔴" if days == 1 else "🟡"
                    lines = [
                        f"{emoji} <b>Muddat eslatmasi!</b>\n",
                        f"<b>{len(user_tenders)}</b> ta tender <b>{days} kun</b>da tugaydi:\n",
                    ]
                    for t in user_tenders[:10]:
                        lines.append(
                            f"⏰ <b>{t.title[:80]}</b>\n"
                            f"   💰 {_fmt_amount(t.amount)} | 📅 {_fmt_deadline(t.deadline)}\n"
                        )
                    tg_message = "\n".join(lines)

                    channel = None
                    if user.notify_telegram and user.telegram_id:
                        tg_ok = await notif_service.send_telegram(user.telegram_id, tg_message)
                        if tg_ok:
                            channel = "telegram"

                    if user.notify_email and user.email:
                        tender_dicts = [
                            {"title": t.title, "amount": t.amount or 0, "deadline": str(t.deadline.date())}
                            for t in user_tenders
                        ]
                        email_ok = await notif_service.send_deadline_email(
                            user.email, user.full_name, tender_dicts, days
                        )
                        if email_ok:
                            channel = channel or "email"

                    if channel:
                        notification = Notification(
                            user_id=user.id,
                            type="deadline",
                            channel=channel,
                            title=f"{len(user_tenders)} ta tender {days} kunda tugaydi",
                            message=tg_message,
                            is_sent=True,
                        )
                        session.add(notification)
                        sent += 1

            await session.commit()
        return sent

    count = _run_async(_send())
    logger.info("Deadline reminders sent: %d", count)
    return {"sent": count}
