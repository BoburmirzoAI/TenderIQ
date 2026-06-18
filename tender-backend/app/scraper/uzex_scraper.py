"""Scraper for xarid.uzex.uz government tender portal."""

import logging
from typing import Any

from app.scraper.base_scraper import BaseScraper
from app.scraper.cleaner import clean_amount, clean_category, clean_date, clean_region
from app.scraper.parser import parse_tender_html

logger = logging.getLogger(__name__)


class UzexScraper(BaseScraper):
    """Scrapes tenders and results from xarid.uzex.uz."""

    source_name = "uzex"
    base_url = "https://xarid.uzex.uz"

    async def scrape(self) -> list[dict[str, Any]]:
        """Scrape active tenders from UZEX."""
        tenders = []
        list_url = f"{self.base_url}/api/tenders?status=active&limit=50"

        html = await self.fetch_page(list_url)
        if not html:
            logger.error("Failed to fetch UZEX tender list")
            return tenders

        raw_tenders = parse_tender_html(html, source="uzex")

        for raw in raw_tenders:
            tender = {
                "external_id": f"uzex_{raw.get('id', '')}",
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
                "contact_info": raw.get("contact", ""),
                "requirements": raw.get("requirements", ""),
                "search_text": f"{raw.get('title', '')} {raw.get('description', '')}",
            }
            tenders.append(tender)

        await self.store_last_run()
        logger.info("UZEX scrape complete: %d tenders found", len(tenders))
        return tenders

    async def scrape_results(self) -> list[dict[str, Any]]:
        """Scrape tender results (winners) from UZEX."""
        results = []
        results_url = f"{self.base_url}/api/results?limit=50"

        html = await self.fetch_page(results_url)
        if not html:
            return results

        raw_results = parse_tender_html(html, source="uzex_results")

        for raw in raw_results:
            result = {
                "external_tender_id": f"uzex_{raw.get('tender_id', '')}",
                "winner_name": raw.get("winner_name", ""),
                "winner_stir": raw.get("winner_stir", ""),
                "winning_amount": clean_amount(raw.get("amount", "")),
                "currency": "UZS",
                "contract_number": raw.get("contract_number", ""),
            }
            results.append(result)

        logger.info("UZEX results scrape complete: %d results found", len(results))
        return results
