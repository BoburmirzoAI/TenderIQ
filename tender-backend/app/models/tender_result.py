"""Tender result (winner) database model."""

from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class TenderResult(BaseModel):
    """Winner record for a completed tender."""

    __tablename__ = "tender_results"

    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False, index=True)
    winner_name = Column(String(500), nullable=False)
    winner_stir = Column(String(9), nullable=True, index=True)
    winning_amount = Column(Float, nullable=True)
    currency = Column(String(10), default="UZS", nullable=False)
    contract_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

    tender = relationship("Tender", back_populates="results")
