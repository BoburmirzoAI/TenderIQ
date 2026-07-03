"""One-time script to scrape historical tenders."""

import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def scrape_historical() -> None:
    """Scrape last 6 months of tenders from all sources."""
    from app.scraper.sources.uzex_scraper import UzexScraper
    from app.scraper.sources.mc_scraper import MCScraper

    logger.info("Starting historical scrape...")

    uzex = UzexScraper()
    tenders = await uzex.scrape()
    logger.info("UZEX: %d tenders scraped", len(tenders))

    mc = MCScraper()
    mc_tenders = await mc.scrape()
    logger.info("MC: %d tenders scraped", len(mc_tenders))

    logger.info("Historical scrape complete. Total: %d", len(tenders) + len(mc_tenders))


if __name__ == "__main__":
    asyncio.run(scrape_historical())
