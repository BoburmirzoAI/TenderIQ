"""Tender repository with filtering and full-text search."""

import re
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenders.tender import Tender
from app.repositories.base import BaseRepository


class TenderRepository(BaseRepository[Tender]):
    """Repository for tender data access with complex filtering."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Tender, session)

    async def get_by_external_id(self, external_id: str) -> Optional[Tender]:
        """Find tender by external source ID."""
        result = await self.session.execute(
            select(Tender).where(Tender.external_id == external_id)
        )
        return result.scalar_one_or_none()

    async def get_filtered(
        self,
        skip: int = 0,
        limit: int = 20,
        category: Optional[str] = None,
        region: Optional[str] = None,
        status: Optional[str] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        source: Optional[str] = None,
        search: Optional[str] = None,
        deadline_before: Optional[datetime] = None,
        deadline_after: Optional[datetime] = None,
    ) -> tuple[list[Tender], int]:
        """Fetch tenders with filters, returning items and total count."""
        conditions = [Tender.is_deleted.is_(False)]

        if category:
            conditions.append(Tender.category == category)
        if region:
            conditions.append(Tender.region == region)
        if status:
            conditions.append(Tender.status == status)
        if min_amount is not None:
            conditions.append(Tender.amount >= min_amount)
        if max_amount is not None:
            conditions.append(Tender.amount <= max_amount)
        if source:
            conditions.append(Tender.source == source)
        if deadline_before:
            conditions.append(Tender.deadline <= deadline_before)
        if deadline_after:
            conditions.append(Tender.deadline >= deadline_after)
        if search:
            escaped = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            if len(search) <= 3:
                conditions.append(
                    or_(
                        Tender.category.ilike(escaped, escape="\\"),
                        Tender.title.op("~*")(f"\\m{re.escape(search)}\\M"),
                        Tender.organization.op("~*")(f"\\m{re.escape(search)}\\M"),
                        Tender.search_text.op("~*")(f"\\m{re.escape(search)}\\M"),
                    )
                )
            else:
                search_pattern = f"%{escaped}%"
                conditions.append(
                    or_(
                        Tender.title.ilike(search_pattern, escape="\\"),
                        Tender.description.ilike(search_pattern, escape="\\"),
                        Tender.organization.ilike(search_pattern, escape="\\"),
                        Tender.search_text.ilike(search_pattern, escape="\\"),
                    )
                )

        where_clause = and_(*conditions)

        count_result = await self.session.execute(
            select(func.count()).select_from(Tender).where(where_clause)
        )
        total = count_result.scalar_one()

        result = await self.session.execute(
            select(Tender)
            .where(where_clause)
            .order_by(Tender.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        items = list(result.scalars().all())

        return items, total

    async def get_active_tenders(self, skip: int = 0, limit: int = 50) -> list[Tender]:
        """Fetch currently active tenders."""
        result = await self.session.execute(
            select(Tender)
            .where(Tender.status == "active", Tender.is_deleted.is_(False))
            .order_by(Tender.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_recent(self, hours: int = 24, limit: int = 100) -> list[Tender]:
        """Fetch tenders created in the last N hours."""
        from datetime import timedelta, timezone

        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        result = await self.session.execute(
            select(Tender)
            .where(Tender.created_at >= cutoff, Tender.is_deleted.is_(False))
            .order_by(Tender.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def external_id_exists(self, external_id: str) -> bool:
        """Check if a tender with this external ID already exists."""
        result = await self.session.execute(
            select(func.count()).select_from(Tender).where(Tender.external_id == external_id)
        )
        return result.scalar_one() > 0

    async def bulk_create(self, tenders_data: list[dict[str, Any]]) -> list[Tender]:
        """Insert multiple tenders at once."""
        tenders = [Tender(**data) for data in tenders_data]
        self.session.add_all(tenders)
        await self.session.commit()
        for t in tenders:
            await self.session.refresh(t)
        return tenders

    async def count_by_status(self) -> dict[str, int]:
        """Count tenders grouped by status."""
        result = await self.session.execute(
            select(Tender.status, func.count())
            .where(Tender.is_deleted.is_(False))
            .group_by(Tender.status)
        )
        return dict(result.all())

    async def count_by_region(self) -> dict[str, int]:
        result = await self.session.execute(
            select(Tender.region, func.count())
            .where(Tender.is_deleted.is_(False), Tender.region.isnot(None))
            .group_by(Tender.region)
        )
        return dict(result.all())

    async def avg_amount_by_category(self) -> dict[str, float]:
        result = await self.session.execute(
            select(Tender.category, func.avg(Tender.amount))
            .where(Tender.is_deleted.is_(False), Tender.category.isnot(None), Tender.amount.isnot(None))
            .group_by(Tender.category)
        )
        return {k: round(v, 0) for k, v in result.all() if k}

    async def top_organizations(self, limit: int = 10) -> list[dict]:
        result = await self.session.execute(
            select(Tender.organization, func.count().label("count"))
            .where(Tender.is_deleted.is_(False), Tender.organization.isnot(None))
            .group_by(Tender.organization)
            .order_by(func.count().desc())
            .limit(limit)
        )
        return [{"organization": r[0], "count": r[1]} for r in result.all()]
