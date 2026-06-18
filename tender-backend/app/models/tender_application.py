"""Tender application tracking model — pipeline/kanban for bid process."""

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class TenderApplication(BaseModel):
    """Tracks user's application process for a specific tender."""

    __tablename__ = "tender_applications"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False, index=True)
    stage = Column(
        String(30),
        default="discovered",
        nullable=False,
        index=True,
    )
    priority = Column(String(10), default="medium", nullable=False)
    bid_amount = Column(Float, nullable=True)
    currency = Column(String(10), default="UZS", nullable=False)
    notes = Column(Text, nullable=True)
    assigned_to = Column(String(255), nullable=True)
    win_probability = Column(Float, nullable=True)
    result = Column(String(20), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="applications")
    tender = relationship("Tender", back_populates="applications")

    __table_args__ = (
        UniqueConstraint("user_id", "tender_id", name="uq_user_tender_application"),
    )
