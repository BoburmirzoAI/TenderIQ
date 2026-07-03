"""Analytics and competitor analysis schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CompetitorRead(BaseModel):
    """Competitor company info."""

    model_config = ConfigDict(from_attributes=True)

    name: str
    stir: Optional[str] = None
    total_wins: int
    total_amount: float
    avg_winning_amount: float
    categories: list[str]
    regions: list[str]
    last_win_date: Optional[datetime] = None


class CompetitorAnalysis(BaseModel):
    """Full competitor analysis for a category/region."""

    total_competitors: int
    top_competitors: list[CompetitorRead]
    market_concentration: float
    avg_tender_amount: float
    total_tenders: int


class PriceHistory(BaseModel):
    """Historical price data point."""

    date: datetime
    amount: float
    category: str
    region: Optional[str] = None
    winner: Optional[str] = None


class MarketOverview(BaseModel):
    """Market overview statistics."""

    total_active_tenders: int
    total_closed_tenders: int
    avg_amount_by_category: dict[str, float]
    tender_count_by_region: dict[str, int]
    trend_direction: str
    top_organizations: list[dict[str, int | str]]
