"""Audit log database model."""

from sqlalchemy import Column, Integer, String, Text

from app.models.base import BaseModel


class AuditLog(BaseModel):
    """Audit trail for admin and system actions."""

    __tablename__ = "audit_logs"

    user_id = Column(Integer, nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
