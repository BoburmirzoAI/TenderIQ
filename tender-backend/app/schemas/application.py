"""Schemas for tender application pipeline."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

VALID_STAGES = [
    "discovered",
    "analyzing",
    "preparing",
    "submitted",
    "under_review",
    "won",
    "lost",
    "cancelled",
]

VALID_PRIORITIES = ["low", "medium", "high", "urgent"]


class ApplicationCreate(BaseModel):
    tender_id: int
    stage: str = "discovered"
    priority: str = "medium"
    bid_amount: Optional[float] = None
    currency: str = "UZS"
    notes: Optional[str] = None
    assigned_to: Optional[str] = None


class ApplicationUpdate(BaseModel):
    stage: Optional[str] = None
    priority: Optional[str] = None
    bid_amount: Optional[float] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    win_probability: Optional[float] = Field(None, ge=0, le=100)
    result: Optional[str] = None


class ApplicationRead(BaseModel):
    id: int
    user_id: int
    tender_id: int
    stage: str
    priority: str
    bid_amount: Optional[float]
    currency: str
    notes: Optional[str]
    assigned_to: Optional[str]
    win_probability: Optional[float]
    result: Optional[str]
    submitted_at: Optional[datetime]
    decided_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ApplicationWithTender(ApplicationRead):
    tender_title: Optional[str] = None
    tender_organization: Optional[str] = None
    tender_category: Optional[str] = None
    tender_region: Optional[str] = None
    tender_amount: Optional[float] = None
    tender_deadline: Optional[datetime] = None
    tender_status: Optional[str] = None


class ApplicationStats(BaseModel):
    total: int
    by_stage: dict[str, int]
    by_priority: dict[str, int]
    total_bid_amount: float
    won_count: int
    lost_count: int
    win_rate: Optional[float]
    avg_bid_amount: Optional[float]
