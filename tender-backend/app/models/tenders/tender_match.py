"""Tender-company match database model."""

from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class TenderMatch(BaseModel):
    """Match between a tender and a company with relevance score."""

    __tablename__ = "tender_matches"

    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    score = Column(Float, nullable=False)
    text_score = Column(Float, nullable=True)
    category_score = Column(Float, nullable=True)
    region_score = Column(Float, nullable=True)
    amount_score = Column(Float, nullable=True)
    is_notified = Column(Boolean, default=False, nullable=False)
    is_saved = Column(Boolean, default=False, nullable=False)
    notification_channel = Column(String(20), nullable=True)

    tender = relationship("Tender", back_populates="matches")
    company = relationship("Company", back_populates="tender_matches")

    __table_args__ = (
        UniqueConstraint("tender_id", "company_id", name="uq_tender_company_match"),
    )
