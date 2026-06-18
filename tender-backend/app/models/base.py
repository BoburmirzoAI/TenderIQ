"""Base model classes and mixins for all database models."""

from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, Column, DateTime, Integer, func
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """SQLAlchemy declarative base."""

    pass


class TimestampMixin:
    """Adds created_at and updated_at columns."""

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class SoftDeleteMixin:
    """Adds soft delete capability."""

    __allow_unmapped__ = True

    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)


class BaseModel(Base, TimestampMixin):
    """Abstract base model with id and timestamps."""

    __abstract__ = True

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)

    def to_dict(self) -> dict[str, Any]:
        """Convert model instance to dictionary."""
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} id={self.id}>"
