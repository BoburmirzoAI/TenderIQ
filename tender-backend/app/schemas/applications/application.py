"""Schemas for tender application pipeline."""

from datetime import datetime
from typing import Literal, Optional

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

StageType = Literal[
    "discovered", "analyzing", "preparing", "submitted",
    "under_review", "won", "lost", "cancelled",
]
PriorityType = Literal["low", "medium", "high", "urgent"]
ResultType = Literal["won", "lost", "cancelled"]


class ApplicationCreate(BaseModel):
    tender_id: int
    stage: StageType = "discovered"
    priority: PriorityType = "medium"
    bid_amount: Optional[float] = Field(None, ge=0)
    currency: str = "UZS"
    notes: Optional[str] = Field(None, max_length=5000)
    assigned_to: Optional[str] = Field(None, max_length=200)


class ApplicationUpdate(BaseModel):
    stage: Optional[StageType] = None
    priority: Optional[PriorityType] = None
    bid_amount: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=5000)
    assigned_to: Optional[str] = Field(None, max_length=200)
    win_probability: Optional[float] = Field(None, ge=0, le=100)
    result: Optional[ResultType] = None


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
