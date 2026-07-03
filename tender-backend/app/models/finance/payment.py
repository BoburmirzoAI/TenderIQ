"""Payment database model."""

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Payment(BaseModel):
    """Payment transaction record."""

    __tablename__ = "payments"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True)
    provider = Column(String(20), nullable=False)
    transaction_id = Column(String(255), unique=True, nullable=True, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="UZS", nullable=False)
    status = Column(String(20), default="pending", nullable=False, index=True)
    plan = Column(String(20), nullable=False)
    error_message = Column(Text, nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    metadata_json = Column(Text, nullable=True)

    user = relationship("User", back_populates="payments")
    subscription = relationship("Subscription")
