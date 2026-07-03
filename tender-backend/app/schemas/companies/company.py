"""Company profile schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CompanyCreate(BaseModel):
    """Create company profile payload."""

    name: str = Field(min_length=2, max_length=500)
    stir: Optional[str] = Field(None, min_length=9, max_length=9)
    description: Optional[str] = None
    categories: Optional[list[str]] = None
    regions: Optional[list[str]] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    keywords: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None


class CompanyRead(BaseModel):
    """Company data returned in API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    stir: Optional[str] = None
    description: Optional[str] = None
    categories: Optional[list[str]] = None
    regions: Optional[list[str]] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    keywords: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    created_at: datetime


class CompanyUpdate(BaseModel):
    """Fields allowed for company update."""

    name: Optional[str] = Field(None, min_length=2, max_length=500)
    description: Optional[str] = None
    categories: Optional[list[str]] = None
    regions: Optional[list[str]] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    keywords: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
