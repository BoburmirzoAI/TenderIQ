"""User database model."""

from sqlalchemy import Boolean, Column, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel, SoftDeleteMixin


class User(BaseModel, SoftDeleteMixin):
    """Platform user account."""

    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), unique=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_superadmin = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    telegram_id = Column(String(50), unique=True, nullable=True, index=True)
    telegram_username = Column(String(255), nullable=True)
    api_key = Column(String(64), unique=True, nullable=True, index=True)
    avatar_url = Column(Text, nullable=True)
    language = Column(String(5), default="uz", nullable=False)
    notify_new_tenders = Column(Boolean, default=True, nullable=False)
    notify_match = Column(Boolean, default=True, nullable=False)
    notify_deadline = Column(Boolean, default=True, nullable=False)
    notify_results = Column(Boolean, default=True, nullable=False)
    notify_email = Column(Boolean, default=False, nullable=False)
    notify_telegram = Column(Boolean, default=True, nullable=False)
    theme = Column(String(10), default="system", nullable=False)

    company = relationship("Company", back_populates="user", uselist=False, lazy="selectin")
    subscriptions = relationship("Subscription", back_populates="user", lazy="selectin")
    payments = relationship("Payment", back_populates="user", lazy="noload")
    notifications = relationship("Notification", back_populates="user", lazy="noload")
    bids = relationship("Bid", back_populates="user", lazy="noload")
    applications = relationship("TenderApplication", back_populates="user", lazy="noload")
