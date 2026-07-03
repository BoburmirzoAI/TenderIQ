"""Document comment model — comments/questions on tender documents."""

from sqlalchemy import Column, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class DocumentComment(BaseModel):
    """Comment or question on a tender document."""

    __tablename__ = "document_comments"

    tender_id = Column(Integer, ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("document_comments.id", ondelete="CASCADE"), nullable=True)
    content = Column(Text, nullable=False)

    user = relationship("User", lazy="selectin")
    replies = relationship("DocumentComment", lazy="selectin", order_by="DocumentComment.created_at")
