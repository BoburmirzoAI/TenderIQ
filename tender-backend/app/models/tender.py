"""Tender database model."""

from sqlalchemy import Column, DateTime, Float, Index, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel, SoftDeleteMixin


class Tender(BaseModel, SoftDeleteMixin):
    """Government tender listing."""

    __tablename__ = "tenders"

    external_id = Column(String(255), unique=True, nullable=False, index=True)
    source = Column(String(50), nullable=False, index=True)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    organization = Column(String(500), nullable=True)
    category = Column(String(50), nullable=True, index=True)
    region = Column(String(50), nullable=True, index=True)
    status = Column(String(20), default="active", nullable=False, index=True)
    amount = Column(Float, nullable=True)
    currency = Column(String(10), default="UZS", nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=True, index=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    url = Column(Text, nullable=True)
    document_urls = Column(Text, nullable=True)
    contact_info = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    search_text = Column(Text, nullable=True)

    results = relationship("TenderResult", back_populates="tender", lazy="noload")
    matches = relationship("TenderMatch", back_populates="tender", lazy="noload")
    applications = relationship("TenderApplication", back_populates="tender", lazy="noload")

    __table_args__ = (
        Index("ix_tenders_category_region", "category", "region"),
        Index("ix_tenders_status_deadline", "status", "deadline"),
        Index("ix_tenders_source_external", "source", "external_id"),
    )
