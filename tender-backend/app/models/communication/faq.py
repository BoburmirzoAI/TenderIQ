"""FAQ model — frequently asked questions."""

from sqlalchemy import Boolean, Column, Integer, String, Text

from app.models.base import BaseModel


class FAQ(BaseModel):
    """Frequently asked question."""

    __tablename__ = "faqs"

    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String(50), nullable=True, index=True)
    order = Column(Integer, default=0)
    is_published = Column(Boolean, default=True, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
