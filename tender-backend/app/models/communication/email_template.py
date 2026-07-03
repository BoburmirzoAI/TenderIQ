"""Email template model for storing editable email templates."""

from sqlalchemy import Boolean, Column, String, Text

from app.models.base import BaseModel


class EmailTemplate(BaseModel):
    """Editable email templates used for transactional emails."""

    __tablename__ = "email_templates"

    slug = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=False)
    description = Column(String(500), nullable=True)
    category = Column(String(50), nullable=False, default="system")
    variables = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
