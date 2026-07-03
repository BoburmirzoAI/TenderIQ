"""Subscription database model."""

from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Subscription(BaseModel):
    """User subscription plan record."""

    __tablename__ = "subscriptions"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    plan = Column(String(20), default="free", nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    starts_at = Column(DateTime(timezone=True), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    daily_requests_used = Column(Integer, default=0, nullable=False)
    last_request_date = Column(String(10), nullable=True)

    user = relationship("User", back_populates="subscriptions")

    @property
    def is_expired(self) -> bool:
        """Check if subscription has expired."""
        if self.expires_at is None:
            return False
        return datetime.now(timezone.utc) > self.expires_at
