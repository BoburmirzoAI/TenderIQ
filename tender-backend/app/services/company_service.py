"""Company service for profile management and statistics."""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import ConflictException, NotFoundException
from app.repositories.company_repo import CompanyRepository
from app.repositories.tender_match_repo import TenderMatchRepository
from app.schemas.company import CompanyCreate, CompanyRead, CompanyUpdate

logger = logging.getLogger(__name__)


class CompanyService:
    """Handles company profile creation, updates, and stats."""

    def __init__(self, session: AsyncSession) -> None:
        self.company_repo = CompanyRepository(session)
        self.match_repo = TenderMatchRepository(session)

    async def create_profile(self, user_id: int, data: CompanyCreate) -> CompanyRead:
        """Create a new company profile for a user."""
        existing = await self.company_repo.get_by_user_id(user_id)
        if existing:
            raise ConflictException("Company profile already exists")

        if data.stir:
            stir_check = await self.company_repo.get_by_stir(data.stir)
            if stir_check:
                raise ConflictException(f"STIR {data.stir} is already registered")

        company = await self.company_repo.create({"user_id": user_id, **data.model_dump()})
        logger.info("Company created for user %d: %s", user_id, company.name)
        return CompanyRead.model_validate(company)

    async def update_profile(self, user_id: int, data: CompanyUpdate) -> CompanyRead:
        """Update an existing company profile."""
        company = await self.company_repo.get_by_user_id(user_id)
        if not company:
            raise NotFoundException("Company")

        updated = await self.company_repo.update(
            company.id, data.model_dump(exclude_unset=True)
        )
        logger.info("Company updated for user %d", user_id)
        return CompanyRead.model_validate(updated)

    async def get_profile(self, user_id: int) -> CompanyRead:
        """Fetch the company profile for a user."""
        company = await self.company_repo.get_by_user_id(user_id)
        if not company:
            raise NotFoundException("Company")
        return CompanyRead.model_validate(company)

    async def get_stats(self, user_id: int) -> dict:
        """Get company matching statistics."""
        company = await self.company_repo.get_by_user_id(user_id)
        if not company:
            raise NotFoundException("Company")

        total_matches = await self.match_repo.count_for_company(company.id)
        saved = await self.match_repo.get_saved_for_company(company.id)

        return {
            "company_name": company.name,
            "total_matches": total_matches,
            "saved_tenders": len(saved),
            "categories": company.categories or [],
            "regions": company.regions or [],
        }
