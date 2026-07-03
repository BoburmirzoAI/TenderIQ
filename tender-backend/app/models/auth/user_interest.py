"""User interest tracking model — stores last 10 meaningful actions (FIFO)."""

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.models.base import Base


class UserInterest(Base):
    """Tracks user's meaningful interactions with tenders.

    Only stores:
    - tender_view: opened tender and stayed 10+ seconds
    - tender_save: saved a tender
    - tender_apply: applied to a tender
    - document_download: downloaded tender documents

    Max 10 records per user (FIFO — oldest removed when 11th is added).
    """

    __tablename__ = "user_interests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False)
    action = Column(String(30), nullable=False)
    category = Column(String(50), nullable=True)
    region = Column(String(50), nullable=True)
    duration_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", lazy="noload")
    tender = relationship("Tender", lazy="noload")
