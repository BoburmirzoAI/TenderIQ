"""Application-wide constants and enumerations."""

from enum import Enum


class SubscriptionPlan(str, Enum):
    """User subscription tiers."""

    FREE = "free"
    PRO = "pro"
    BUSINESS = "business"


class TenderStatus(str, Enum):
    """Lifecycle status of a tender."""

    ACTIVE = "active"
    CLOSED = "closed"
    CANCELLED = "cancelled"
    DRAFT = "draft"
    AWARDED = "awarded"


class TenderCategory(str, Enum):
    """Industry categories for tenders."""

    CONSTRUCTION = "construction"
    IT = "it"
    MEDICAL = "medical"
    EDUCATION = "education"
    FOOD = "food"
    TRANSPORT = "transport"
    ENERGY = "energy"
    AGRICULTURE = "agriculture"
    CONSULTING = "consulting"
    OTHER = "other"


class UzbekRegion(str, Enum):
    """Administrative regions of Uzbekistan."""

    TASHKENT_CITY = "tashkent_city"
    TASHKENT_REGION = "tashkent_region"
    ANDIJAN = "andijan"
    BUKHARA = "bukhara"
    FERGANA = "fergana"
    JIZZAKH = "jizzakh"
    KASHKADARYA = "kashkadarya"
    KHOREZM = "khorezm"
    NAMANGAN = "namangan"
    NAVOI = "navoi"
    SAMARKAND = "samarkand"
    SIRDARYA = "sirdarya"
    SURKHANDARYA = "surkhandarya"
    KARAKALPAKSTAN = "karakalpakstan"


class NotificationType(str, Enum):
    """Notification delivery channels."""

    TELEGRAM = "telegram"
    EMAIL = "email"
    PUSH = "push"
    IN_APP = "in_app"


class PaymentProvider(str, Enum):
    """Payment processing providers."""

    CLICK = "click"
    PAYME = "payme"


class PaymentStatus(str, Enum):
    """Payment transaction states."""

    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class AuditAction(str, Enum):
    """Auditable admin actions."""

    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    USER_BANNED = "user_banned"
    SUBSCRIPTION_CHANGED = "subscription_changed"
    PAYMENT_PROCESSED = "payment_processed"
    TENDER_IMPORTED = "tender_imported"
    MODEL_RETRAINED = "model_retrained"
    SETTINGS_CHANGED = "settings_changed"


PLAN_LIMITS: dict[SubscriptionPlan, dict] = {
    SubscriptionPlan.FREE: {
        "daily_requests": 50,
        "ml_access": False,
        "api_access": False,
        "document_analysis": False,
        "max_saved_tenders": 10,
        "max_team_members": 1,
    },
    SubscriptionPlan.PRO: {
        "daily_requests": 500,
        "ml_access": True,
        "api_access": False,
        "document_analysis": True,
        "max_saved_tenders": 500,
        "max_team_members": 1,
    },
    SubscriptionPlan.BUSINESS: {
        "daily_requests": 5000,
        "ml_access": True,
        "api_access": True,
        "document_analysis": True,
        "max_saved_tenders": -1,
        "max_team_members": 5,
    },
}

PLAN_PRICES_UZS: dict[SubscriptionPlan, int] = {
    SubscriptionPlan.FREE: 0,
    SubscriptionPlan.PRO: 299_000,
    SubscriptionPlan.BUSINESS: 990_000,
}

MATCH_SCORE_THRESHOLD: float = 65.0

MATCH_WEIGHTS: dict[str, float] = {
    "text": 0.60,
    "category": 0.25,
    "region": 0.10,
    "amount": 0.05,
}
