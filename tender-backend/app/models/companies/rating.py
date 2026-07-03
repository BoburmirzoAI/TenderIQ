"""Company rating model — tracks organization ratings by category."""

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class CompanyRating(BaseModel):
    """Rating record for a company in a specific category."""

    __tablename__ = "company_ratings"

    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    score = Column(Float, nullable=False, default=0.0)
    grade = Column(String(5), nullable=False, default="D")
    wins = Column(Integer, nullable=False, default=0)
    losses = Column(Integer, nullable=False, default=0)
    total_bids = Column(Integer, nullable=False, default=0)
    total_contract_amount = Column(Float, nullable=False, default=0.0)
    region = Column(String(50), nullable=True)
    last_activity = Column(DateTime(timezone=True), nullable=True)

    company = relationship("Company", lazy="selectin")
