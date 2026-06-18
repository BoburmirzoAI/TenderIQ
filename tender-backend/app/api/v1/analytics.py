"""Analytics and competitor analysis endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.analytics import CompetitorAnalysis, MarketOverview, PriceHistory
from app.schemas.base import SuccessResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/competitors", response_model=SuccessResponse[CompetitorAnalysis])
async def get_competitors(
    category: Optional[str] = None,
    region: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get competitor analysis for a category/region."""
    service = AnalyticsService(db)
    analysis = await service.get_competitors(category=category, region=region, limit=limit)
    return SuccessResponse(data=analysis)


@router.get("/price-history", response_model=SuccessResponse[list[PriceHistory]])
async def get_price_history(
    category: Optional[str] = None,
    region: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get historical winning prices."""
    service = AnalyticsService(db)
    history = await service.get_price_history(category=category, region=region, limit=limit)
    return SuccessResponse(data=history)


@router.get("/market", response_model=SuccessResponse[MarketOverview])
async def get_market_overview(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get market overview statistics."""
    service = AnalyticsService(db)
    overview = await service.get_market_overview()
    return SuccessResponse(data=overview)


@router.get("/anomalies", response_model=SuccessResponse[list[dict]])
async def detect_anomalies(
    category: Optional[str] = None,
    region: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Detect suspicious patterns in tender results."""
    service = AnalyticsService(db)
    anomalies = await service.detect_anomalies(category=category, region=region)
    return SuccessResponse(data=anomalies)
