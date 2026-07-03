"""Scraper for my.gov.uz additional tender source."""

import logging
from typing import Any

from app.scraper.core.base_scraper import BaseScraper
from app.scraper.core.cleaner import clean_amount, clean_category, clean_date, clean_region
from app.scraper.core.parser import parse_tender_html

logger = logging.getLogger(__name__)


class MyGovScraper(BaseScraper):
    """Scrapes tenders from my.gov.uz."""

    source_name = "mygov"
    base_url = "https://my.gov.uz"

    async def scrape(self) -> list[dict[str, Any]]:
        """Scrape active tenders from my.gov.uz."""
        tenders = []
        list_url = f"{self.base_url}/oz/tenders"

        html = await self.fetch_page(list_url)
        if not html:
            logger.error("Failed to fetch MyGov tender list")
            return tenders

        raw_tenders = parse_tender_html(html, source="mygov")

        for raw in raw_tenders:
            tender = {
                "external_id": f"mygov_{raw.get('id', '')}",
                "source": self.source_name,
                "title": raw.get("title", ""),
                "description": raw.get("description", ""),
                "organization": raw.get("organization", ""),
                "category": clean_category(raw.get("category", "")),
                "region": clean_region(raw.get("region", "")),
                "status": "active",
                "amount": clean_amount(raw.get("amount", "")),
                "currency": "UZS",
                "deadline": clean_date(raw.get("deadline", "")),
                "published_at": clean_date(raw.get("published_at", "")),
                "url": raw.get("url", ""),
                "search_text": f"{raw.get('title', '')} {raw.get('description', '')}",
            }
            tenders.append(tender)

        await self.store_last_run()
        logger.info("MyGov scrape complete: %d tenders found", len(tenders))
        return tenders

    async def scrape_results(self) -> list[dict[str, Any]]:
        """Scrape tender results from my.gov.uz (not available)."""
        return []
