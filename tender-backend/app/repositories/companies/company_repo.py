"""Company repository for company-specific queries."""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.companies.company import Company
from app.repositories.base import BaseRepository


class CompanyRepository(BaseRepository[Company]):
    """Repository for company data access."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Company, session)

    async def get_by_user_id(self, user_id: int) -> Optional[Company]:
        """Find company by owner user ID."""
        result = await self.session.execute(
            select(Company).where(Company.user_id == user_id, Company.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def get_by_stir(self, stir: str) -> Optional[Company]:
        """Find company by STIR (tax ID)."""
        result = await self.session.execute(select(Company).where(Company.stir == stir))
        return result.scalar_one_or_none()

    async def get_by_categories(self, categories: list[str]) -> list[Company]:
        """Find companies matching any of the given categories."""
        all_companies = await self.get_all_active()
        return [
            c
            for c in all_companies
            if c.categories and any(cat in c.categories for cat in categories)
        ]

    async def get_all_active(self) -> list[Company]:
        """Fetch all non-deleted companies."""
        result = await self.session.execute(
            select(Company).where(Company.is_deleted.is_(False))
        )
        return list(result.scalars().all())
