"""Promo code database model."""

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text

from app.models.base import BaseModel


class PromoCode(BaseModel):
    __tablename__ = "promo_codes"

    code = Column(String(50), unique=True, nullable=False, index=True)
    discount_type = Column(String(10), nullable=False)  # percent | fixed
    discount_value = Column(Float, nullable=False)
    plan = Column(String(20), nullable=False, default="all")  # pro | business | all
    max_uses = Column(Integer, nullable=False, default=100)
    used_count = Column(Integer, nullable=False, default=0)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    description = Column(Text, nullable=True)
