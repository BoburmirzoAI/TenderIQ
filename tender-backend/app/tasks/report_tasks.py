"""Celery tasks for report generation."""

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


@celery_app.task(name="app.tasks.report_tasks.generate_weekly_reports")
def generate_weekly_reports():
    """Generate weekly reports for all subscribed companies."""
    logger.info("Generating weekly reports")

    async def _generate():
        from app.database import async_session
        from app.repositories.company_repo import CompanyRepository
        from app.services.report_service import ReportService

        async with async_session() as session:
            company_repo = CompanyRepository(session)
            companies = await company_repo.get_all_active()
            report_service = ReportService()

            generated = 0
            for company in companies:
                try:
                    await report_service.generate_pdf_report(
                        tenders=[],
                        company_name=company.name,
                        title="Weekly Tender Report",
                    )
                    generated += 1
                except Exception as e:
                    logger.warning("Report failed for company %d: %s", company.id, str(e))

            return generated

    count = _run_async(_generate())
    logger.info("Weekly reports generated: %d", count)
    return {"generated": count}


@celery_app.task(name="app.tasks.report_tasks.send_digest_emails")
def send_digest_emails():
    """Send weekly digest emails to subscribed users."""
    logger.info("Sending digest emails")

    async def _send():
        from datetime import datetime, timedelta

        from sqlalchemy import func, select
        from app.database import async_session
        from app.models.tender import Tender
        from app.models.tender_application import TenderApplication
        from app.models.tender_match import TenderMatch
        from app.models.user import User
        from app.services.notification_service import NotificationService

        week_ago = datetime.now() - timedelta(days=7)
        sent = 0

        async with async_session() as session:
            notif_service = NotificationService()

            users_result = await session.execute(
                select(User).where(User.is_active.is_(True), User.notify_email.is_(True))
            )
            users = users_result.scalars().all()

            new_tenders_count = (
                await session.execute(
                    select(func.count()).select_from(Tender).where(
                        Tender.created_at >= week_ago, Tender.is_deleted.is_(False)
                    )
                )
            ).scalar_one()

            for user in users:
                try:
                    matches_result = await session.execute(
                        select(TenderMatch).where(
                            TenderMatch.company_id == user.company.id if user.company else None,
                            TenderMatch.created_at >= week_ago,
                        ).order_by(TenderMatch.score.desc()).limit(10)
                    )
                    matches = matches_result.scalars().all()

                    match_list = []
                    for m in matches:
                        tender = await session.get(Tender, m.tender_id)
                        if tender:
                            match_list.append({
                                "title": tender.title[:100],
                                "score": m.score,
                                "amount": tender.amount or 0,
                                "deadline": str(tender.deadline.date()) if tender.deadline else "N/A",
                            })

                    apps_count = (
                        await session.execute(
                            select(func.count()).select_from(TenderApplication).where(
                                TenderApplication.user_id == user.id,
                                TenderApplication.created_at >= week_ago,
                            )
                        )
                    ).scalar_one()

                    won_count = (
                        await session.execute(
                            select(func.count()).select_from(TenderApplication).where(
                                TenderApplication.user_id == user.id,
                                TenderApplication.result == "won",
                                TenderApplication.updated_at >= week_ago,
                            )
                        )
                    ).scalar_one()

                    stats = {
                        "new_tenders": new_tenders_count,
                        "matched": len(matches),
                        "applications": apps_count,
                        "won": won_count,
                    }

                    ok = await notif_service.send_digest_email(
                        user.email, user.full_name, match_list, stats
                    )
                    if ok:
                        sent += 1
                except Exception as e:
                    logger.warning("Digest email failed for user %d: %s", user.id, str(e))

        return sent

    count = _run_async(_send())
    logger.info("Digest emails sent: %d", count)
    return {"sent": count}
