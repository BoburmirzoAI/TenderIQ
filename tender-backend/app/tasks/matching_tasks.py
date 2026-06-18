"""Celery tasks for tender-company matching."""

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


@celery_app.task(name="app.tasks.matching_tasks.match_tender_with_companies")
def match_tender_with_companies(tender_id: int):
    """Find all matching companies for a tender and create match records."""

    async def _match():
        from app.database import async_session
        from app.services.matching_service import MatchingService

        async with async_session() as session:
            service = MatchingService(session)
            matches = await service.find_matches_for_tender(tender_id)

            if matches:
                from app.tasks.notification_tasks import send_match_batch

                send_match_batch.delay([m["match_id"] for m in matches])

            return len(matches)

    count = _run_async(_match())
    logger.info("Tender %d: %d matches found", tender_id, count)
    return {"tender_id": tender_id, "matches": count}


@celery_app.task(name="app.tasks.matching_tasks.rematch_company_profile")
def rematch_company_profile(company_id: int):
    """Re-run matching for a company after profile update."""

    async def _rematch():
        from app.database import async_session
        from app.repositories.tender_repo import TenderRepository
        from app.services.matching_service import MatchingService

        async with async_session() as session:
            tender_repo = TenderRepository(session)
            active_tenders = await tender_repo.get_active_tenders(limit=200)

            service = MatchingService(session)
            total = await service.batch_match([t.id for t in active_tenders])
            return total

    count = _run_async(_rematch())
    logger.info("Company %d rematched: %d new matches", company_id, count)
    return {"company_id": company_id, "new_matches": count}
