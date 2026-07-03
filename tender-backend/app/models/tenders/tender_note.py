"""Tender notes/comments model."""

from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class TenderNote(BaseModel):
    """User notes/comments on a tender."""

    __tablename__ = "tender_notes"

    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    color = Column(String(20), default="default", nullable=False)

    tender = relationship("Tender", lazy="selectin")
    user = relationship("User", lazy="selectin")
