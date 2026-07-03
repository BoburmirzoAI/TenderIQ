"""Tender note schemas."""

from datetime import datetime
from typing import Optional

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ALLOWED_COLORS = Literal["default", "yellow", "green", "blue", "red"]


class NoteCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    color: ALLOWED_COLORS = "default"


class NoteUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=2000)
    color: Optional[ALLOWED_COLORS] = None


class NoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tender_id: int
    user_id: int
    content: str
    color: str
    created_at: datetime
    updated_at: datetime
    user_name: Optional[str] = None
