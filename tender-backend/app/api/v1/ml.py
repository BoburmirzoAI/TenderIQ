"""Machine learning prediction endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_plan
from app.models.user import User
from app.schemas.base import SuccessResponse
from app.models.tender import Tender
from app.schemas.ml import (
    OptimalBidRequest,
    OptimalBidResponse,
    PricePredictRequest,
    PricePredictResponse,
    RiskAssessmentRequest,
    RiskAssessmentResponse,
    TenderSimilarityRequest,
    TenderSimilarityResponse,
    TextSimilarityRequest,
    TextSimilarityResponse,
    TrendForecastRequest,
    TrendForecastResponse,
    WinProbabilityRequest,
    WinProbabilityResponse,
)
from app.services.ml_service import MLService

router = APIRouter()


@router.post("/predict-price", response_model=SuccessResponse[PricePredictResponse])
async def predict_price(
    data: PricePredictRequest,
    user: User = Depends(require_plan("ml_access")),
):
    """Predict optimal bid price for a tender (Pro+ only)."""
    service = MLService()
    prediction = await service.predict_price(data)
    return SuccessResponse(data=prediction)


@router.post("/win-probability", response_model=SuccessResponse[WinProbabilityResponse])
async def predict_win_probability(
    data: WinProbabilityRequest,
    user: User = Depends(require_plan("ml_access")),
):
    """Predict probability of winning a tender (Pro+ only)."""
    service = MLService()
    prediction = await service.predict_win_probability(data)
    return SuccessResponse(data=prediction)


@router.post("/tender-similarity", response_model=SuccessResponse[TenderSimilarityResponse])
async def compare_tenders(
    data: TenderSimilarityRequest,
    user: User = Depends(require_plan("ml_access")),
):
    """Compare two tenders for similarity (Pro+ only)."""
    service = MLService()
    result = await service.compare_tenders(data)
    return SuccessResponse(data=result)


@router.post("/text-similarity", response_model=SuccessResponse[TextSimilarityResponse])
async def compare_texts(
    data: TextSimilarityRequest,
    user: User = Depends(require_plan("ml_access")),
):
    """Compare two texts for similarity (Pro+ only)."""
    service = MLService()
    result = await service.compare_texts(data)
    return SuccessResponse(data=result)


@router.post("/risk-assessment", response_model=SuccessResponse[RiskAssessmentResponse])
async def assess_risk(
    data: RiskAssessmentRequest,
    user: User = Depends(require_plan("ml_access")),
):
    """Assess risks of a tender opportunity (Pro+ only)."""
    service = MLService()
    result = await service.assess_risk(data)
    return SuccessResponse(data=result)


@router.post("/optimal-bid", response_model=SuccessResponse[OptimalBidResponse])
async def predict_optimal_bid(
    data: OptimalBidRequest,
    user: User = Depends(require_plan("ml_access")),
):
    """Recommend optimal bid amount for a tender (Pro+ only)."""
    service = MLService()
    prediction = await service.predict_optimal_bid(data)
    return SuccessResponse(data=prediction)


@router.post("/trend-forecast", response_model=SuccessResponse[TrendForecastResponse])
async def forecast_trends(
    data: TrendForecastRequest,
    user: User = Depends(require_plan("ml_access")),
    db: AsyncSession = Depends(get_db),
):
    """Forecast market trends based on historical data (Pro+ only)."""
    from sqlalchemy import select

    query = select(Tender).where(Tender.is_deleted.is_(False))
    if data.category:
        query = query.where(Tender.category == data.category)
    if data.region:
        query = query.where(Tender.region == data.region)
    query = query.order_by(Tender.published_at.asc())

    result = await db.execute(query)
    tenders = result.scalars().all()

    tender_dicts = [
        {
            "published_at": t.published_at,
            "created_at": t.created_at,
            "amount": t.amount,
            "category": t.category,
            "region": t.region,
        }
        for t in tenders
    ]

    service = MLService()
    forecast = await service.forecast_trends(data, tender_dicts)
    return SuccessResponse(data=forecast)


@router.get("/model-info", response_model=SuccessResponse[dict])
async def get_model_info(
    user: User = Depends(require_plan("ml_access")),
):
    """Get current ML model metadata (Pro+ only)."""
    service = MLService()
    info = await service.get_model_info()
    return SuccessResponse(data=info)
