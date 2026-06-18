"""Scraper for tender.mc.uz construction tender portal."""

import logging
from typing import Any

from app.scraper.base_scraper import BaseScraper
from app.scraper.cleaner import clean_amount, clean_category, clean_date, clean_region
from app.scraper.parser import parse_tender_html

logger = logging.getLogger(__name__)


class MCScraper(BaseScraper):
    """Scrapes construction tenders from tender.mc.uz."""

    source_name = "mc"
    base_url = "https://tender.mc.uz"

    async def scrape(self) -> list[dict[str, Any]]:
        """Scrape active construction tenders."""
        tenders = []
        list_url = f"{self.base_url}/tenders/active"

        html = await self.fetch_page(list_url)
        if not html:
            logger.error("Failed to fetch MC tender list")
            return tenders

        raw_tenders = parse_tender_html(html, source="mc")

        for raw in raw_tenders:
            tender = {
                "external_id": f"mc_{raw.get('id', '')}",
                "source": self.source_name,
                "title": raw.get("title", ""),
                "description": raw.get("description", ""),
                "organization": raw.get("organization", ""),
                "category": "construction",
                "region": clean_region(raw.get("region", "")),
                "status": "active",
                "amount": clean_amount(raw.get("amount", "")),
                "currency": "UZS",
                "deadline": clean_date(raw.get("deadline", "")),
                "published_at": clean_date(raw.get("published_at", "")),
                "url": raw.get("url", ""),
                "contact_info": raw.get("contact", ""),
                "requirements": raw.get("requirements", ""),
                "search_text": f"{raw.get('title', '')} {raw.get('description', '')}",
            }
            tenders.append(tender)

        await self.store_last_run()
        logger.info("MC scrape complete: %d tenders found", len(tenders))
        return tenders

    async def scrape_results(self) -> list[dict[str, Any]]:
        """Scrape tender results from MC portal."""
        results = []
        results_url = f"{self.base_url}/tenders/completed"

        html = await self.fetch_page(results_url)
        if not html:
            return results

        raw_results = parse_tender_html(html, source="mc_results")

        for raw in raw_results:
            result = {
                "external_tender_id": f"mc_{raw.get('tender_id', '')}",
                "winner_name": raw.get("winner_name", ""),
                "winner_stir": raw.get("winner_stir", ""),
                "winning_amount": clean_amount(raw.get("amount", "")),
                "currency": "UZS",
            }
            results.append(result)

        logger.info("MC results scrape complete: %d results found", len(results))
        return results
