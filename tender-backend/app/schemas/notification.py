"""Notification schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    tender_id: Optional[int] = None
    type: str
    channel: str
    title: str
    message: str
    is_read: bool
    is_sent: bool
    created_at: datetime


class NotificationStats(BaseModel):
    total: int
    unread: int
