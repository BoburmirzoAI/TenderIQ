"""Saved search schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SearchFilters(BaseModel):
    category: Optional[str] = None
    region: Optional[str] = None
    status: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    source: Optional[str] = None
    search: Optional[str] = None


class SavedSearchCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    filters: SearchFilters


class SavedSearchUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    filters: Optional[SearchFilters] = None


class SavedSearchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    filters: SearchFilters
    created_at: datetime
    updated_at: datetime
