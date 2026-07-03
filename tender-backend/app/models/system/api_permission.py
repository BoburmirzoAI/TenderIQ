"""API endpoint permission rules — stored in DB, cached in Redis."""

from sqlalchemy import Boolean, Column, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY

from app.models.base import BaseModel


class APIPermission(BaseModel):
    __tablename__ = "api_permissions"

    path = Column(String(500), nullable=False, index=True)
    method = Column(String(10), nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    allowed_roles = Column(ARRAY(String), nullable=True)
    blocked_user_ids = Column(ARRAY(Integer), nullable=True)
    rate_limit = Column(Integer, nullable=True)
    rate_window = Column(Integer, default=60, nullable=False)
    description = Column(Text, nullable=True)
