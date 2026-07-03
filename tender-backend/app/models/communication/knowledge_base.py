"""Knowledge base model — articles, guides, tutorials."""

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class KBCategory(BaseModel):
    """Knowledge base category."""

    __tablename__ = "kb_categories"

    name = Column(String(100), nullable=False, unique=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    order = Column(Integer, default=0)

    articles = relationship("KBArticle", back_populates="category", lazy="noload")


class KBArticle(BaseModel):
    """Knowledge base article."""

    __tablename__ = "kb_articles"

    category_id = Column(Integer, ForeignKey("kb_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    slug = Column(String(500), nullable=False, unique=True, index=True)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_published = Column(Boolean, default=True, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    tags = Column(Text, nullable=True)
    order = Column(Integer, default=0)

    category = relationship("KBCategory", back_populates="articles", lazy="selectin")
    author = relationship("User", lazy="selectin")
