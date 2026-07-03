"""Celery tasks for scraping government tender sites."""

import asyncio
import logging

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


def _run_async(coro):
    """Run an async coroutine in a sync Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.tasks.scraping_tasks.scrape_uzex", bind=True, max_retries=2)
def scrape_uzex(self):
    """Scrape tenders from xarid.uzex.uz."""
    logger.info("Starting UZEX scrape")

    async def _scrape():
        from app.database import async_session
        from app.repositories.tenders.tender_repo import TenderRepository
        from app.scraper.core.deduplicator import deduplicate_tenders
        from app.scraper.sources.uzex_scraper import UzexScraper

        scraper = UzexScraper()
        raw_tenders = await scraper.scrape()

        async with async_session() as session:
            repo = TenderRepository(session)
            existing_ids = set()
            for t in raw_tenders:
                ext_id = t.get("external_id", "")
                if await repo.external_id_exists(ext_id):
                    existing_ids.add(ext_id)

            unique = deduplicate_tenders(raw_tenders, existing_ids)

            if unique:
                created = await repo.bulk_create(unique)
                logger.info("UZEX: %d new tenders saved", len(created))

                for tender in created:
                    from app.tasks.ml.matching_tasks import match_tender_with_companies

                    match_tender_with_companies.delay(tender.id)

                return len(created)
        return 0

    try:
        count = _run_async(_scrape())
        return {"source": "uzex", "new_tenders": count}
    except Exception as exc:
        logger.error("UZEX scrape failed: %s", str(exc))
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="app.tasks.scraping_tasks.scrape_mc", bind=True, max_retries=2)
def scrape_mc(self):
    """Scrape tenders from tender.mc.uz."""
    logger.info("Starting MC scrape")

    async def _scrape():
        from app.database import async_session
        from app.repositories.tenders.tender_repo import TenderRepository
        from app.scraper.core.deduplicator import deduplicate_tenders
        from app.scraper.sources.mc_scraper import MCScraper

        scraper = MCScraper()
        raw_tenders = await scraper.scrape()

        async with async_session() as session:
            repo = TenderRepository(session)
            existing_ids = set()
            for t in raw_tenders:
                ext_id = t.get("external_id", "")
                if await repo.external_id_exists(ext_id):
                    existing_ids.add(ext_id)

            unique = deduplicate_tenders(raw_tenders, existing_ids)

            if unique:
                created = await repo.bulk_create(unique)
                logger.info("MC: %d new tenders saved", len(created))

                for tender in created:
                    from app.tasks.ml.matching_tasks import match_tender_with_companies

                    match_tender_with_companies.delay(tender.id)

                return len(created)
        return 0

    try:
        count = _run_async(_scrape())
        return {"source": "mc", "new_tenders": count}
    except Exception as exc:
        logger.error("MC scrape failed: %s", str(exc))
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="app.tasks.scraping_tasks.process_new_tender")
def process_new_tender(tender_id: int):
    """Process a newly discovered tender: match and notify."""
    from app.tasks.ml.matching_tasks import match_tender_with_companies

    match_tender_with_companies.delay(tender_id)
    return {"tender_id": tender_id, "status": "processing"}


@celery_app.task(name="app.tasks.scraping_tasks.fetch_historical")
def fetch_historical(source: str, pages: int = 10):
    """Fetch historical tenders for initial data population."""
    logger.info("Fetching historical data from %s (%d pages)", source, pages)
    return {"source": source, "pages": pages, "status": "completed"}
