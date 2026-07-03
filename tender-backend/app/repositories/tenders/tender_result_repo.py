"""Tender result repository for winner history queries."""

from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenders.tender import Tender
from app.models.tenders.tender_result import TenderResult
from app.repositories.base import BaseRepository
from app.utils import escape_like as _esc


class TenderResultRepository(BaseRepository[TenderResult]):
    """Repository for tender result (winner) data access."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(TenderResult, session)

    async def get_by_tender_id(self, tender_id: int) -> list[TenderResult]:
        """Fetch all results for a specific tender."""
        result = await self.session.execute(
            select(TenderResult).where(TenderResult.tender_id == tender_id)
        )
        return list(result.scalars().all())

    async def get_winner_history(
        self,
        winner_stir: Optional[str] = None,
        winner_name: Optional[str] = None,
        limit: int = 50,
    ) -> list[TenderResult]:
        """Fetch win history for a company by STIR or name."""
        stmt = select(TenderResult)
        if winner_stir:
            stmt = stmt.where(TenderResult.winner_stir == winner_stir)
        elif winner_name:
            escaped_name = winner_name.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            stmt = stmt.where(TenderResult.winner_name.ilike(f"%{_esc(escaped_name)}%", escape="\\"))
        result = await self.session.execute(
            stmt.order_by(TenderResult.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def get_top_winners(
        self,
        category: Optional[str] = None,
        region: Optional[str] = None,
        limit: int = 10,
    ) -> list[dict]:
        """Get top winners by number of wins, optionally filtered."""
        stmt = (
            select(
                TenderResult.winner_name,
                TenderResult.winner_stir,
                func.count().label("total_wins"),
                func.sum(TenderResult.winning_amount).label("total_amount"),
                func.avg(TenderResult.winning_amount).label("avg_amount"),
            )
            .group_by(TenderResult.winner_name, TenderResult.winner_stir)
            .order_by(func.count().desc())
            .limit(limit)
        )

        if category or region:
            stmt = stmt.join(Tender, TenderResult.tender_id == Tender.id)
            if category:
                stmt = stmt.where(Tender.category == category)
            if region:
                stmt = stmt.where(Tender.region == region)

        result = await self.session.execute(stmt)
        rows = result.all()
        return [
            {
                "winner_name": row.winner_name,
                "winner_stir": row.winner_stir,
                "total_wins": row.total_wins,
                "total_amount": float(row.total_amount or 0),
                "avg_amount": float(row.avg_amount or 0),
            }
            for row in rows
        ]

    async def get_price_history(
        self,
        category: Optional[str] = None,
        region: Optional[str] = None,
        limit: int = 100,
    ) -> list[dict]:
        """Fetch historical winning prices for trend analysis."""
        stmt = (
            select(
                TenderResult.winning_amount,
                TenderResult.winner_name,
                TenderResult.created_at,
                Tender.category,
                Tender.region,
            )
            .join(Tender, TenderResult.tender_id == Tender.id)
            .where(TenderResult.winning_amount.isnot(None))
            .order_by(TenderResult.created_at.desc())
            .limit(limit)
        )

        if category:
            stmt = stmt.where(Tender.category == category)
        if region:
            stmt = stmt.where(Tender.region == region)

        result = await self.session.execute(stmt)
        rows = result.all()
        return [
            {
                "amount": float(row.winning_amount),
                "winner": row.winner_name,
                "date": row.created_at,
                "category": row.category,
                "region": row.region,
            }
            for row in rows
        ]
