"""Bid database model."""

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Bid(BaseModel):
    """User-submitted bid for a tender."""

    __tablename__ = "bids"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="UZS", nullable=False)
    predicted_amount = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(20), default="draft", nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="bids")
    tender = relationship("Tender")
