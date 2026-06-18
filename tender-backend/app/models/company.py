"""Company database model."""

from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON

from app.models.base import BaseModel, SoftDeleteMixin


class Company(BaseModel, SoftDeleteMixin):
    """Company profile linked to a user."""

    __tablename__ = "companies"

    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    name = Column(String(500), nullable=False, index=True)
    stir = Column(String(9), unique=True, nullable=True, index=True)
    description = Column(Text, nullable=True)
    categories = Column(JSON, nullable=True)
    regions = Column(JSON, nullable=True)
    min_amount = Column(Float, nullable=True)
    max_amount = Column(Float, nullable=True)
    keywords = Column(Text, nullable=True)
    contact_person = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    website = Column(String(500), nullable=True)

    user = relationship("User", back_populates="company")
    tender_matches = relationship("TenderMatch", back_populates="company", lazy="noload")
