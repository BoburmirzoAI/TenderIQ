"""Purchase plan model — planned tenders before official announcement."""

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class PurchasePlan(BaseModel):
    """Planned purchase/tender that hasn't been officially announced yet."""

    __tablename__ = "purchase_plans"

    plan_number = Column(String(100), unique=True, nullable=True, index=True)
    title = Column(Text, nullable=False)
    organization = Column(String(500), nullable=False)
    organization_stir = Column(String(9), nullable=True, index=True)
    category = Column(String(50), nullable=True, index=True)
    region = Column(String(50), nullable=True, index=True)
    budget_type = Column(String(50), nullable=True)
    estimated_amount = Column(Float, nullable=True)
    currency = Column(String(10), default="UZS")
    planned_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(30), default="planned", nullable=False, index=True)
    source = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    lot_count = Column(Integer, nullable=True)
    lot_type = Column(String(50), nullable=True)
