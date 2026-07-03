"""Contact request model — public contact form submissions."""

from sqlalchemy import Boolean, Column, String, Text

from app.models.base import BaseModel


class ContactRequest(BaseModel):
    """Public contact/inquiry form submission."""

    __tablename__ = "contact_requests"

    name = Column(String(255), nullable=False)
    stir = Column(String(9), nullable=True)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    category = Column(String(50), nullable=True)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    is_responded = Column(Boolean, default=False, nullable=False)
