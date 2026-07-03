"""Tender match repository for match management."""

from typing import Optional

from sqlalchemy import and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenders.tender_match import TenderMatch
from app.repositories.base import BaseRepository


class TenderMatchRepository(BaseRepository[TenderMatch]):
    """Repository for tender-company match data access."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(TenderMatch, session)

    async def get_by_tender_and_company(
        self, tender_id: int, company_id: int
    ) -> Optional[TenderMatch]:
        """Find a specific match record."""
        result = await self.session.execute(
            select(TenderMatch).where(
                TenderMatch.tender_id == tender_id,
                TenderMatch.company_id == company_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_matches_for_company(
        self, company_id: int, skip: int = 0, limit: int = 20, min_score: float = 0.0
    ) -> tuple[list[TenderMatch], int]:
        """Fetch matches for a company above a minimum score."""
        conditions = [
            TenderMatch.company_id == company_id,
            TenderMatch.score >= min_score,
        ]
        where_clause = and_(*conditions)

        count_result = await self.session.execute(
            select(func.count()).select_from(TenderMatch).where(where_clause)
        )
        total = count_result.scalar_one()

        result = await self.session.execute(
            select(TenderMatch)
            .where(where_clause)
            .order_by(TenderMatch.score.desc())
            .offset(skip)
            .limit(limit)
        )
        items = list(result.scalars().all())
        return items, total

    async def get_unnotified_matches(self, limit: int = 100) -> list[TenderMatch]:
        """Fetch matches that haven't been sent as notifications yet."""
        result = await self.session.execute(
            select(TenderMatch)
            .where(TenderMatch.is_notified.is_(False))
            .order_by(TenderMatch.score.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_notified(self, match_id: int, channel: str) -> None:
        """Mark a match as notified via a specific channel."""
        await self.session.execute(
            update(TenderMatch)
            .where(TenderMatch.id == match_id)
            .values(is_notified=True, notification_channel=channel)
        )
        await self.session.commit()

    async def toggle_saved(self, match_id: int) -> bool:
        """Toggle the saved status of a match, returning the new state."""
        match = await self.get_by_id(match_id)
        if not match:
            return False
        match.is_saved = not match.is_saved
        await self.session.commit()
        return match.is_saved

    async def get_saved_for_company(self, company_id: int) -> list[TenderMatch]:
        """Fetch all saved matches for a company."""
        result = await self.session.execute(
            select(TenderMatch).where(
                TenderMatch.company_id == company_id,
                TenderMatch.is_saved.is_(True),
            )
        )
        return list(result.scalars().all())

    async def count_for_company(self, company_id: int) -> int:
        """Count total matches for a company."""
        result = await self.session.execute(
            select(func.count())
            .select_from(TenderMatch)
            .where(TenderMatch.company_id == company_id)
        )
        return result.scalar_one()
