"""Machine learning prediction schemas."""

from typing import Optional

from pydantic import BaseModel


class PricePredictRequest(BaseModel):
    """Input for price prediction."""

    category: str
    region: str
    organization: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None


class PricePredictResponse(BaseModel):
    """Price prediction result."""

    predicted_amount: float
    confidence: float
    lower_bound: float
    upper_bound: float
    currency: str = "UZS"
    model_version: str
    features_used: list[str]


class WinProbabilityRequest(BaseModel):
    """Input for win probability prediction."""

    tender_id: Optional[int] = None
    category: str
    region: str
    tender_amount: float = 0
    bid_amount: Optional[float] = None
    company_experience: int = 0
    category_match: bool = False
    region_match: bool = False
    competitor_count: int = 5
    days_until_deadline: Optional[int] = None
    past_wins_category: int = 0


class WinProbabilityFactor(BaseModel):
    """Single factor in win probability breakdown."""

    name: str
    impact: float
    detail: str


class WinProbabilityResponse(BaseModel):
    """Win probability prediction result."""

    win_probability: float
    risk_level: str
    recommendation: str
    factors: list[WinProbabilityFactor]
    model_version: str
    confidence: float


class OptimalBidRequest(BaseModel):
    """Input for optimal bid recommendation."""

    category: str
    region: str
    tender_amount: float
    company_experience: int = 0
    category_match: bool = False
    region_match: bool = False
    competitor_count: int = 5
    days_until_deadline: Optional[int] = None
    past_wins_category: int = 0


class OptimalBidStrategy(BaseModel):
    """Single bid strategy option."""

    name: str
    description: str
    bid_amount: float
    win_probability: float
    profit_margin: float
    expected_value: float
    recommended: bool


class OptimalBidChartPoint(BaseModel):
    """Single point for bid simulation chart."""

    bid_ratio: float
    bid_amount: float
    win_probability: float
    expected_value: float
    profit_margin: float


class OptimalBidResponse(BaseModel):
    """Optimal bid recommendation result."""

    tender_amount: float
    optimal_bid: float
    optimal_ratio: float
    win_probability: float
    expected_value: float
    profit_margin: float
    strategies: list[OptimalBidStrategy]
    chart_data: list[OptimalBidChartPoint]
    recommendation: str


class RiskAssessmentRequest(BaseModel):
    """Input for risk assessment."""

    category: str
    region: str
    tender_amount: float = 0
    avg_market_amount: float = 0
    company_max_budget: float = 0
    company_experience: int = 0
    category_match: bool = False
    region_match: bool = False
    competitor_count: int = 0
    days_until_deadline: Optional[int] = None
    past_wins_category: int = 0
    active_projects: int = 0
    requires_documents: bool = False
    requires_license: bool = False
    requires_guarantee: bool = False
    required_document_count: int = 0
    organization_reliability: str = "unknown"
    category_trend: str = "stable"
    category_competition: str = "normal"


class RiskItem(BaseModel):
    """Single risk dimension result."""

    name: str
    category: str
    score: float
    level: str
    label: str
    details: list[str]


class RiskAssessmentResponse(BaseModel):
    """Risk assessment result."""

    overall_score: float
    overall_level: str
    overall_label: str
    verdict: str
    risks: list[RiskItem]
    recommendations: list[str]
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int


class TenderSimilarityInput(BaseModel):
    """Single tender data for similarity comparison."""

    title: str = ""
    description: str = ""
    organization: str = ""
    category: str = ""
    region: str = ""
    amount: float = 0


class TenderSimilarityRequest(BaseModel):
    """Input for tender similarity comparison."""

    tender_a: TenderSimilarityInput
    tender_b: TenderSimilarityInput


class SimilarityFactor(BaseModel):
    """Single factor in similarity breakdown."""

    name: str
    score: float
    weight: int


class TenderSimilarityResponse(BaseModel):
    """Tender similarity comparison result."""

    overall_similarity: float
    factors: list[SimilarityFactor]
    level: str


class TextSimilarityRequest(BaseModel):
    """Input for text-only similarity."""

    text1: str
    text2: str


class TextSimilarityResponse(BaseModel):
    """Text similarity result."""

    similarity: float
    level: str


class TrendForecastRequest(BaseModel):
    """Input for market trend forecast."""

    category: Optional[str] = None
    region: Optional[str] = None
    forecast_months: int = 6


class TrendHistoryPoint(BaseModel):
    """Historical data point with trend line."""

    month: str
    count: int = 0
    avg_amount: float = 0
    total_amount: float = 0
    trend_count: int = 0
    trend_amount: float = 0
    is_forecast: bool = False


class TrendForecastPoint(BaseModel):
    """Forecasted data point."""

    month: str
    predicted_count: int = 0
    predicted_avg_amount: float = 0
    predicted_total_amount: float = 0
    is_forecast: bool = True


class TrendSummary(BaseModel):
    """Trend forecast summary statistics."""

    count_trend: str
    amount_trend: str
    growth_rate: float
    avg_monthly_count: float
    avg_monthly_amount: float
    total_months_analyzed: int
    forecast_months: int
    confidence: int
    r2_count: float
    r2_amount: float


class TrendForecastResponse(BaseModel):
    """Market trend forecast result."""

    history: list[TrendHistoryPoint]
    forecast: list[TrendForecastPoint]
    summary: TrendSummary
    insights: list[str]


class MatchScoreRequest(BaseModel):
    """Input for match score calculation."""

    tender_id: int
    company_id: int


class MatchScoreResponse(BaseModel):
    """Match score breakdown."""

    total_score: float
    text_score: float
    category_score: float
    region_score: float
    amount_score: float
    is_match: bool
