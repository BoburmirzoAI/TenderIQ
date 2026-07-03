"""Saved search model."""

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class SavedSearch(BaseModel):
    """User's saved tender search filters."""

    __tablename__ = "saved_searches"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    filters = Column(Text, nullable=False)
    notify = Column(Boolean, default=False, nullable=False, server_default="0")

    user = relationship("User", lazy="selectin")
