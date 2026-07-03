"""Subscription and plan schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class SubscriptionRead(BaseModel):
    """Current subscription info."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    plan: str
    is_active: bool
    starts_at: datetime
    expires_at: Optional[datetime] = None
    daily_requests_used: int
    is_expired: bool


class PlanInfo(BaseModel):
    """Plan feature details."""

    name: str
    price_uzs: int
    daily_requests: int
    ml_access: bool
    api_access: bool
    document_analysis: bool
    max_saved_tenders: int
    max_team_members: int


class UsageStats(BaseModel):
    """Current usage statistics for a user."""

    plan: str
    daily_requests_used: int
    daily_requests_limit: int
    saved_tenders: int
    max_saved_tenders: int
    days_remaining: Optional[int] = None
