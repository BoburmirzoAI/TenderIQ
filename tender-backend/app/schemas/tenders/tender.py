"""Tender schemas for listing, filtering, and detail views."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class TenderRead(BaseModel):
    """Full tender data."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    external_id: str
    source: str
    title: str
    description: Optional[str] = None
    organization: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None
    status: str
    amount: Optional[float] = None
    currency: str
    deadline: Optional[datetime] = None
    published_at: Optional[datetime] = None
    url: Optional[str] = None
    created_at: datetime


class TenderListItem(BaseModel):
    """Compact tender for list views."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    organization: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None
    status: str
    amount: Optional[float] = None
    currency: str
    deadline: Optional[datetime] = None
    source: str


class TenderDetail(TenderRead):
    """Tender with match score and related data."""

    match_score: Optional[float] = None
    is_saved: bool = False
    requirements: Optional[str] = None
    contact_info: Optional[str] = None
    document_urls: Optional[str] = None


class TenderFilter(BaseModel):
    """Filter parameters for tender search."""

    category: Optional[str] = None
    region: Optional[str] = None
    status: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    source: Optional[str] = None
    search: Optional[str] = None
    deadline_before: Optional[datetime] = None
    deadline_after: Optional[datetime] = None
