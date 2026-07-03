"""Contract registry model — signed contracts from tenders."""

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Contract(BaseModel):
    """Signed contract resulting from a tender."""

    __tablename__ = "contracts"

    contract_number = Column(String(100), unique=True, nullable=True, index=True)
    tender_id = Column(Integer, ForeignKey("tenders.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(Text, nullable=False)
    buyer_name = Column(String(500), nullable=False)
    buyer_stir = Column(String(9), nullable=True, index=True)
    supplier_name = Column(String(500), nullable=False)
    supplier_stir = Column(String(9), nullable=True, index=True)
    category = Column(String(50), nullable=True, index=True)
    region = Column(String(50), nullable=True, index=True)
    amount = Column(Float, nullable=True)
    currency = Column(String(10), default="UZS")
    signed_date = Column(DateTime(timezone=True), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(30), default="active", nullable=False, index=True)
    contract_type = Column(String(50), nullable=True)
    source = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)

    tender = relationship("Tender", lazy="noload")
