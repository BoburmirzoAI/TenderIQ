"""Admin panel schemas — all admin-specific Pydantic models."""

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, field_validator


# ─── Existing schemas (kept for backwards compat) ────────────────────────────

class AdminStats(BaseModel):
    total_users: int
    active_users: int
    total_companies: int
    total_tenders: int
    active_tenders: int
    total_matches: int
    total_payments: float
    pro_subscribers: int
    business_subscribers: int
    tenders_today: int
    matches_today: int


class AdminUserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    is_admin: bool
    is_superadmin: bool = False
    is_verified: bool
    telegram_id: Optional[str] = None
    current_plan: str = "free"
    company_name: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None

    @field_validator("current_plan", mode="before")
    @classmethod
    def resolve_plan(cls, v: Any, info: Any) -> str:
        return v or "free"

    @field_validator("company_name", mode="before")
    @classmethod
    def resolve_company(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if hasattr(v, "name"):
            return v.name
        return str(v)


class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    is_verified: Optional[bool] = None
    plan: Optional[str] = None


# ─── Dashboard ────────────────────────────────────────────────────────────────

class DashboardKPI(BaseModel):
    total_users: int
    active_users: int
    total_tenders: int
    active_tenders: int
    tenders_today: int
    pro_subscribers: int
    business_subscribers: int
    total_revenue: float
    new_users_today: int
    total_companies: int


class SourceChartPoint(BaseModel):
    day: str
    uzex: int
    mc: int
    mygov: int


class PlanDistributionItem(BaseModel):
    name: str
    value: int


class AuditLogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int] = None
    admin_email: Optional[str] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    details: Optional[str] = None
    created_at: datetime


class QuickActionResponse(BaseModel):
    action: str
    status: str
    message: str
    task_id: Optional[str] = None


# ─── Users ────────────────────────────────────────────────────────────────────

class AdminUserDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    is_admin: bool
    is_superadmin: bool
    is_verified: bool
    telegram_id: Optional[str] = None
    telegram_username: Optional[str] = None
    language: str
    theme: str
    notify_new_tenders: bool
    notify_match: bool
    notify_deadline: bool
    notify_email: bool
    notify_telegram: bool
    current_plan: str = "free"
    company_name: Optional[str] = None
    created_at: datetime
    api_key_exists: bool = False

    @field_validator("current_plan", mode="before")
    @classmethod
    def resolve_plan(cls, v: Any) -> str:
        return v or "free"

    @field_validator("company_name", mode="before")
    @classmethod
    def resolve_company(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if hasattr(v, "name"):
            return v.name
        return str(v)

    @field_validator("api_key_exists", mode="before")
    @classmethod
    def resolve_api_key(cls, v: Any) -> bool:
        return bool(v)


class AdminUserRoleUpdate(BaseModel):
    is_admin: Optional[bool] = None
    is_verified: Optional[bool] = None
    is_active: Optional[bool] = None


# ─── Tenders ──────────────────────────────────────────────────────────────────

class AdminTenderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    external_id: str
    source: str
    title: str
    organization: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None
    status: str
    amount: Optional[float] = None
    currency: str
    deadline: Optional[datetime] = None
    published_at: Optional[datetime] = None
    url: Optional[str] = None
    is_deleted: bool
    created_at: datetime


class AdminTenderUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None
    amount: Optional[float] = None
    organization: Optional[str] = None


class AdminTenderBulkDelete(BaseModel):
    ids: List[int]


class ScraperInfo(BaseModel):
    id: str
    name: str
    status: str
    last_run: Optional[datetime] = None
    last_count: int = 0


# ─── Companies ────────────────────────────────────────────────────────────────

class AdminCompanyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    stir: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    is_deleted: bool = False
    created_at: datetime
    owner_email: Optional[str] = None
    owner_name: Optional[str] = None


class AdminCompanyUpdate(BaseModel):
    name: Optional[str] = None
    stir: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None


class AdminCompanyVerify(BaseModel):
    verified: bool


# ─── Financials ───────────────────────────────────────────────────────────────

class RevenueOverview(BaseModel):
    total_revenue: float
    completed_payments: int
    failed_payments: int
    pending_payments: int
    pro_subscribers: int
    business_subscribers: int
    free_users: int
    mrr: float
    arr: float


class RevenueChartPoint(BaseModel):
    day: str
    click: float
    payme: float


class AdminPaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    amount: float
    currency: str
    provider: str
    plan: str
    status: str
    transaction_id: Optional[str] = None
    error_message: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    user_email: Optional[str] = None
    user_name: Optional[str] = None


class AdminSubscriptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    plan: str
    is_active: bool
    starts_at: datetime
    expires_at: Optional[datetime] = None
    daily_requests_used: int
    created_at: datetime
    user_email: Optional[str] = None
    user_name: Optional[str] = None


class AdminSubscriptionUpdate(BaseModel):
    plan: Optional[str] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None
    daily_requests_used: Optional[int] = None


class PlanPrices(BaseModel):
    free: int
    pro: int
    business: int


class PlanPricesUpdate(BaseModel):
    pro: Optional[int] = None
    business: Optional[int] = None


# ─── Analytics ────────────────────────────────────────────────────────────────

class CategoryStat(BaseModel):
    name: str
    count: int


class RegionStat(BaseModel):
    name: str
    amount: float
    count: int


class AnomalyItem(BaseModel):
    id: int
    tender_id: int
    tender_title: str
    anomaly_type: str
    severity: str
    details: str


class TrendPoint(BaseModel):
    month: str
    count: int
    amount: float


# ─── Pipeline (Applications) ──────────────────────────────────────────────────

class AdminApplicationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    tender_id: int
    stage: str
    priority: str
    bid_amount: Optional[float] = None
    win_probability: Optional[float] = None
    result: Optional[str] = None
    created_at: datetime
    tender_title: Optional[str] = None
    tender_amount: Optional[float] = None
    tender_deadline: Optional[datetime] = None
    user_email: Optional[str] = None
    company_name: Optional[str] = None


class AdminApplicationStageUpdate(BaseModel):
    stage: str


class PipelineStats(BaseModel):
    stages: List[dict]
    total: int


# ─── ML Models ────────────────────────────────────────────────────────────────

class MLModelStats(BaseModel):
    total_predictions: int
    price_predictions: int
    win_predictions: int
    risk_predictions: int
    similarity_predictions: int
    avg_confidence: float
    last_retrain: Optional[datetime] = None


class MLPredictionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tender_id: int
    tender_title: Optional[str] = None
    prediction_type: str
    result: Optional[str] = None
    confidence: Optional[float] = None
    win_probability: Optional[float] = None
    optimal_bid_min: Optional[float] = None
    optimal_bid_max: Optional[float] = None
    risk_level: Optional[str] = None
    created_at: datetime
    user_email: Optional[str] = None


class MLUsagePoint(BaseModel):
    day: str
    price: int
    win: int
    risk: int
    similarity: int


class MLRetrainResponse(BaseModel):
    task_id: Optional[str] = None
    status: str
    message: str


# ─── Platform Health ──────────────────────────────────────────────────────────

class ServiceStatusItem(BaseModel):
    name: str
    status: str
    latency: Optional[str] = None
    uptime: Optional[str] = None
    details: Optional[str] = None


class SystemMetrics(BaseModel):
    cpu_percent: float
    ram_percent: float
    ram_used_mb: float
    ram_total_mb: float
    disk_percent: float
    disk_used_gb: float
    disk_total_gb: float


class ErrorLogEntry(BaseModel):
    time: str
    level: str
    message: str


class HealthOverview(BaseModel):
    services: List[ServiceStatusItem]
    metrics: SystemMetrics
    recent_errors: List[ErrorLogEntry]


# ─── Notifications ────────────────────────────────────────────────────────────

class BroadcastRequest(BaseModel):
    title: str
    message: str
    channels: List[str] = ["in_app"]
    channel: Optional[str] = None
    target: str = "all"
    plan_filter: Optional[str] = None


class AdminNotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    type: str
    channel: str
    title: str
    message: str
    is_read: bool
    is_sent: bool
    error_message: Optional[str] = None
    created_at: datetime
    user_email: Optional[str] = None


class NotificationDeliveryStats(BaseModel):
    channel: str
    sent: int
    delivered: int
    delivery_rate: float


class NotificationStats(BaseModel):
    total_sent: int
    total_read: int
    read_rate: float
    by_channel: List[NotificationDeliveryStats]
    by_type: List[dict]


# ─── Roles & Permissions ─────────────────────────────────────────────────────

class RoleInfo(BaseModel):
    name: str
    label: str
    description: str
    users_count: int
    color: str


class PermissionInfo(BaseModel):
    key: str
    label: str
    description: str
    module: str


class UserRoleItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    is_admin: bool
    is_superadmin: bool
    is_active: bool
    is_verified: bool


class RoleAssignRequest(BaseModel):
    user_id: int
    is_admin: bool
    is_superadmin: bool = False


# ─── Settings ─────────────────────────────────────────────────────────────────

class FeatureFlags(BaseModel):
    scraper_enabled: bool = True
    ml_free_access: bool = False
    maintenance_mode: bool = False
    registration_enabled: bool = True
    bot_enabled: bool = True
    email_enabled: bool = True


class ScraperConfig(BaseModel):
    max_retries: int = 3
    timeout: int = 30
    uzex_enabled: bool = True
    mc_enabled: bool = True
    mygov_enabled: bool = True


class MatchingWeights(BaseModel):
    text: int = 60
    category: int = 25
    region: int = 10
    amount: int = 5
    threshold: int = 65


class PlanLimitItem(BaseModel):
    price: int
    daily: int
    saved: int
    team: int


class PlanLimitsConfig(BaseModel):
    free: PlanLimitItem
    pro: PlanLimitItem
    business: PlanLimitItem


class SecuritySettings(BaseModel):
    min_password_length: int = 8
    session_timeout: int = 30
    max_login_attempts: int = 5
    two_fa_enabled: bool = False
    require_uppercase: bool = True
    require_numbers: bool = True


class AllSettings(BaseModel):
    flags: FeatureFlags
    scraper: ScraperConfig
    matching: MatchingWeights
    plan_limits: PlanLimitsConfig
    security: SecuritySettings
