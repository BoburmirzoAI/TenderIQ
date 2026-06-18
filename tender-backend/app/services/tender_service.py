"""Tender service for listing, filtering, and watch management."""

import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundException
from app.repositories.tender_match_repo import TenderMatchRepository
from app.repositories.tender_repo import TenderRepository
from app.schemas.tender import TenderDetail, TenderFilter, TenderListItem, TenderRead

logger = logging.getLogger(__name__)


class TenderService:
    """Handles tender browsing, search, and watch/save operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.tender_repo = TenderRepository(session)
        self.match_repo = TenderMatchRepository(session)

    async def get_tenders(
        self,
        filters: TenderFilter,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[TenderListItem], int]:
        """Fetch tenders with applied filters."""
        tenders, total = await self.tender_repo.get_filtered(
            skip=skip,
            limit=limit,
            category=filters.category,
            region=filters.region,
            status=filters.status,
            min_amount=filters.min_amount,
            max_amount=filters.max_amount,
            source=filters.source,
            search=filters.search,
            deadline_before=filters.deadline_before,
            deadline_after=filters.deadline_after,
        )
        items = [TenderListItem.model_validate(t) for t in tenders]
        return items, total

    async def get_tender_detail(
        self, tender_id: int, company_id: Optional[int] = None
    ) -> TenderDetail:
        """Fetch a single tender with optional match info."""
        tender = await self.tender_repo.get_by_id(tender_id)
        if not tender:
            raise NotFoundException("Tender", str(tender_id))

        detail = TenderDetail.model_validate(tender)

        if company_id:
            match = await self.match_repo.get_by_tender_and_company(tender_id, company_id)
            if match:
                detail.match_score = match.score
                detail.is_saved = match.is_saved

        return detail

    async def get_matched_tenders(
        self,
        company_id: int,
        skip: int = 0,
        limit: int = 20,
        min_score: float = 0.0,
    ) -> tuple[list[dict], int]:
        """Fetch tenders matched to a company above a score threshold."""
        matches, total = await self.match_repo.get_matches_for_company(
            company_id=company_id, skip=skip, limit=limit, min_score=min_score
        )
        items = []
        for match in matches:
            tender = await self.tender_repo.get_by_id(match.tender_id)
            if tender:
                items.append(
                    {
                        "tender": TenderListItem.model_validate(tender),
                        "score": match.score,
                        "is_saved": match.is_saved,
                        "match_id": match.id,
                    }
                )
        return items, total

    async def toggle_save(self, match_id: int) -> bool:
        """Toggle the saved status of a matched tender."""
        return await self.match_repo.toggle_saved(match_id)

    async def search_tenders(
        self, query: str, skip: int = 0, limit: int = 20
    ) -> tuple[list[TenderListItem], int]:
        """Search tenders by text query."""
        filters = TenderFilter(search=query)
        return await self.get_tenders(filters, skip=skip, limit=limit)
