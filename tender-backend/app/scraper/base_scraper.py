"""Abstract base scraper with retry logic, rate limiting, and user-agent rotation."""

import asyncio
import logging
import random
import time
from abc import ABC, abstractmethod
from typing import Any, Optional

from app.config import settings

logger = logging.getLogger(__name__)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
]


class BaseScraper(ABC):
    """Base class for all tender site scrapers."""

    source_name: str = "base"
    base_url: str = ""
    max_retries: int = settings.SCRAPER_MAX_RETRIES
    timeout: int = settings.SCRAPER_TIMEOUT

    def __init__(self) -> None:
        self._request_count = 0

    def _get_random_ua(self) -> str:
        """Return a random user agent string."""
        return random.choice(USER_AGENTS)

    async def _delay(self) -> None:
        """Random delay between requests to avoid rate limiting."""
        delay = random.uniform(1.5, 3.0)
        await asyncio.sleep(delay)

    async def fetch_page(self, url: str) -> Optional[str]:
        """Fetch a page with retries and exponential backoff."""
        for attempt in range(1, self.max_retries + 1):
            start = time.time()
            try:
                import httpx

                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(
                        url, headers={"User-Agent": self._get_random_ua()}
                    )
                    response.raise_for_status()
                    duration = time.time() - start
                    self._request_count += 1
                    logger.info(
                        "scraper=%s url=%s attempt=%d duration=%.2fs status=%d",
                        self.source_name,
                        url,
                        attempt,
                        duration,
                        response.status_code,
                    )
                    await self._delay()
                    return response.text
            except Exception as e:
                duration = time.time() - start
                logger.warning(
                    "scraper=%s url=%s attempt=%d/%d duration=%.2fs error=%s",
                    self.source_name,
                    url,
                    attempt,
                    self.max_retries,
                    duration,
                    str(e),
                )
                if attempt < self.max_retries:
                    backoff = 2 ** (attempt - 1)
                    await asyncio.sleep(backoff)
        return None

    async def store_last_run(self) -> None:
        """Store the last scrape timestamp in Redis."""
        try:
            from app.services.cache_service import cache_service

            import time

            key = f"scraper:{self.source_name}:last_run"
            await cache_service.set(key, str(time.time()), expire=86400)
        except Exception as e:
            logger.warning("Failed to store last run time: %s", str(e))

    @abstractmethod
    async def scrape(self) -> list[dict[str, Any]]:
        """Scrape tenders from the source. Must be implemented by subclasses."""
        ...

    @abstractmethod
    async def scrape_results(self) -> list[dict[str, Any]]:
        """Scrape tender results/winners. Must be implemented by subclasses."""
        ...
