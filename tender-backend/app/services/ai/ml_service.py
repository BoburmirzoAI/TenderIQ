"""ML service for price prediction, win probability, optimal bid, and model management."""

import logging
import os
from typing import Optional

from app.config import settings
from app.exceptions import MLModelException
from app.ml.models.optimal_bid_model import OptimalBidModel
from app.ml.models.price_model import PriceModel
from app.ml.models.risk_assessment_model import RiskAssessmentModel
from app.ml.models.tender_similarity_model import TenderSimilarityModel
from app.ml.models.trend_forecast_model import TrendForecastModel
from app.ml.models.win_probability_model import WinProbabilityModel
from app.schemas.ai.ml import (
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

logger = logging.getLogger(__name__)

_price_model: Optional[PriceModel] = None
_win_prob_model: Optional[WinProbabilityModel] = None


class MLService:
    """Handles ML model loading, prediction, and retraining."""

    def __init__(self) -> None:
        self.model_dir = settings.ML_MODEL_DIR

    async def load_model(self) -> PriceModel:
        """Load or return cached price prediction model."""
        global _price_model
        if _price_model is None:
            _price_model = PriceModel()
            model_path = os.path.join(self.model_dir, "price_model.pkl")
            if os.path.exists(model_path):
                _price_model.load(model_path)
                logger.info("Price model loaded from %s", model_path)
            else:
                logger.warning("No saved price model found at %s", model_path)
        return _price_model

    async def load_win_probability_model(self) -> WinProbabilityModel:
        """Load or return cached win probability model."""
        global _win_prob_model
        if _win_prob_model is None:
            _win_prob_model = WinProbabilityModel()
            model_path = os.path.join(self.model_dir, "win_probability_model.pkl")
            if os.path.exists(model_path):
                _win_prob_model.load(model_path)
                logger.info("Win probability model loaded from %s", model_path)
            else:
                logger.info("No trained win probability model — using rule-based fallback")
        return _win_prob_model

    async def predict_win_probability(self, data: WinProbabilityRequest) -> WinProbabilityResponse:
        """Predict probability of winning a tender."""
        model = await self.load_win_probability_model()

        bid_ratio = None
        if data.bid_amount and data.tender_amount > 0:
            bid_ratio = data.bid_amount / data.tender_amount

        features = {
            "category": data.category,
            "region": data.region,
            "tender_amount": data.tender_amount,
            "bid_ratio": bid_ratio,
            "company_experience": data.company_experience,
            "category_match": data.category_match,
            "region_match": data.region_match,
            "competitor_count": data.competitor_count,
            "days_until_deadline": data.days_until_deadline,
            "past_wins_category": data.past_wins_category,
        }

        prediction = model.predict(features)

        return WinProbabilityResponse(
            win_probability=prediction["win_probability"],
            risk_level=prediction["risk_level"],
            recommendation=prediction["recommendation"],
            factors=[
                {"name": f["name"], "impact": f["impact"], "detail": f["detail"]}
                for f in prediction["factors"]
            ],
            model_version=prediction["model_version"],
            confidence=prediction["confidence"],
        )

    async def compare_tenders(self, data: TenderSimilarityRequest) -> TenderSimilarityResponse:
        """Compare two tenders for similarity."""
        model = TenderSimilarityModel()
        result = model.compare_two(
            data.tender_a.model_dump(),
            data.tender_b.model_dump(),
        )
        return TenderSimilarityResponse(**result)

    async def compare_texts(self, data: TextSimilarityRequest) -> TextSimilarityResponse:
        """Compare two texts for similarity."""
        model = TenderSimilarityModel()
        result = model.compare_text_only(data.text1, data.text2)
        return TextSimilarityResponse(
            similarity=result["similarity"],
            level=result["level"],
        )

    async def assess_risk(self, data: RiskAssessmentRequest) -> RiskAssessmentResponse:
        """Assess risks of a tender opportunity."""
        model = RiskAssessmentModel()

        features = {
            "category": data.category,
            "region": data.region,
            "tender_amount": data.tender_amount,
            "avg_market_amount": data.avg_market_amount,
            "company_max_budget": data.company_max_budget,
            "company_experience": data.company_experience,
            "category_match": data.category_match,
            "region_match": data.region_match,
            "competitor_count": data.competitor_count,
            "days_until_deadline": data.days_until_deadline,
            "past_wins_category": data.past_wins_category,
            "active_projects": data.active_projects,
            "requires_documents": data.requires_documents,
            "requires_license": data.requires_license,
            "requires_guarantee": data.requires_guarantee,
            "required_document_count": data.required_document_count,
            "organization_reliability": data.organization_reliability,
            "category_trend": data.category_trend,
            "category_competition": data.category_competition,
        }

        result = model.assess(features)
        return RiskAssessmentResponse(**result)

    async def predict_optimal_bid(self, data: OptimalBidRequest) -> OptimalBidResponse:
        """Recommend optimal bid amount using win probability simulation."""
        win_model = await self.load_win_probability_model()
        bid_model = OptimalBidModel()

        base_features = {
            "category": data.category,
            "region": data.region,
            "tender_amount": data.tender_amount,
            "company_experience": data.company_experience,
            "category_match": data.category_match,
            "region_match": data.region_match,
            "competitor_count": data.competitor_count,
            "days_until_deadline": data.days_until_deadline,
            "past_wins_category": data.past_wins_category,
        }

        result = bid_model.predict(win_model, base_features, data.tender_amount)

        return OptimalBidResponse(**result)

    async def forecast_trends(
        self, data: TrendForecastRequest, tenders: list[dict]
    ) -> TrendForecastResponse:
        """Forecast market trends based on historical tender data."""
        model = TrendForecastModel()
        result = model.forecast_market(
            tenders=tenders,
            forecast_months=data.forecast_months,
            category=data.category,
            region=data.region,
        )
        return TrendForecastResponse(**result)

    async def predict_price(self, data: PricePredictRequest) -> PricePredictResponse:
        """Predict optimal bid price for a tender."""
        model = await self.load_model()

        if not model.is_trained:
            raise MLModelException("Model has not been trained yet")

        features = {
            "category": data.category,
            "region": data.region,
            "organization": data.organization or "",
            "title": data.title or "",
            "description": data.description or "",
        }

        prediction = model.predict(features)

        return PricePredictResponse(
            predicted_amount=prediction["predicted_amount"],
            confidence=prediction["confidence"],
            lower_bound=prediction["lower_bound"],
            upper_bound=prediction["upper_bound"],
            currency="UZS",
            model_version=model.version,
            features_used=list(features.keys()),
        )

    async def get_model_info(self) -> dict:
        """Get current model metadata."""
        model = await self.load_model()
        return {
            "is_trained": model.is_trained,
            "version": model.version,
            "feature_count": model.feature_count,
            "training_samples": model.training_samples,
        }

    async def trigger_retrain(self) -> dict:
        """Trigger model retraining (called from Celery task)."""
        logger.info("Model retrain triggered")
        return {"status": "queued", "message": "Retraining will start shortly"}
