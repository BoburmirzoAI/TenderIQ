"""Analytics service for competitor analysis and market overview."""

import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.tenders.tender_repo import TenderRepository
from app.repositories.tenders.tender_result_repo import TenderResultRepository
from app.schemas.ai.analytics import CompetitorAnalysis, CompetitorRead, MarketOverview, PriceHistory

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Handles competitor analysis, price history, and market overview."""

    def __init__(self, session: AsyncSession) -> None:
        self.result_repo = TenderResultRepository(session)
        self.tender_repo = TenderRepository(session)

    async def get_competitors(
        self,
        category: Optional[str] = None,
        region: Optional[str] = None,
        limit: int = 10,
    ) -> CompetitorAnalysis:
        """Get top competitors for a category/region."""
        winners = await self.result_repo.get_top_winners(
            category=category, region=region, limit=limit
        )

        competitors = [
            CompetitorRead(
                name=w["winner_name"],
                stir=w.get("winner_stir"),
                total_wins=w["total_wins"],
                total_amount=w["total_amount"],
                avg_winning_amount=w["avg_amount"],
                categories=[category] if category else [],
                regions=[region] if region else [],
            )
            for w in winners
        ]

        total_amount = sum(c.total_amount for c in competitors)
        top_amount = competitors[0].total_amount if competitors else 0
        concentration = (top_amount / total_amount) if total_amount > 0 else 0

        total_tenders_count = await self.tender_repo.count(
            **({"category": category} if category else {}),
            **({"region": region} if region else {}),
        )

        return CompetitorAnalysis(
            total_competitors=len(competitors),
            top_competitors=competitors,
            market_concentration=round(concentration, 2),
            avg_tender_amount=(
                total_amount / len(competitors) if competitors else 0
            ),
            total_tenders=total_tenders_count,
        )

    async def get_price_history(
        self,
        category: Optional[str] = None,
        region: Optional[str] = None,
        limit: int = 100,
    ) -> list[PriceHistory]:
        """Fetch historical winning prices."""
        history = await self.result_repo.get_price_history(
            category=category, region=region, limit=limit
        )
        return [
            PriceHistory(
                date=h["date"],
                amount=h["amount"],
                category=h["category"] or "",
                region=h.get("region"),
                winner=h.get("winner"),
            )
            for h in history
        ]

    async def get_market_overview(self) -> MarketOverview:
        """Generate market-wide statistics."""
        status_counts = await self.tender_repo.count_by_status()
        region_counts = await self.tender_repo.count_by_region()
        avg_by_cat = await self.tender_repo.avg_amount_by_category()
        top_orgs = await self.tender_repo.top_organizations(limit=10)

        active = status_counts.get("active", 0)
        closed = status_counts.get("closed", 0)
        total = active + closed
        trend = "up" if active > closed else "down" if closed > active else "stable"

        return MarketOverview(
            total_active_tenders=active,
            total_closed_tenders=closed,
            avg_amount_by_category=avg_by_cat,
            tender_count_by_region=region_counts,
            trend_direction=trend,
            top_organizations=top_orgs,
        )

    async def detect_anomalies(
        self,
        category: Optional[str] = None,
        region: Optional[str] = None,
    ) -> list[dict]:
        """Detect suspicious patterns in tender results."""
        winners = await self.result_repo.get_top_winners(
            category=category, region=region, limit=5
        )

        anomalies = []
        total_wins = sum(w["total_wins"] for w in winners)

        for w in winners:
            if total_wins > 0 and w["total_wins"] / total_wins > 0.4:
                anomalies.append(
                    {
                        "type": "dominant_winner",
                        "company": w["winner_name"],
                        "win_percentage": round(w["total_wins"] / total_wins * 100, 1),
                        "total_wins": w["total_wins"],
                    }
                )

        return anomalies
