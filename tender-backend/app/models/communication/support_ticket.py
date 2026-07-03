"""Support ticket model — user support requests and responses."""

from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class SupportTicket(BaseModel):
    """User support ticket."""

    __tablename__ = "support_tickets"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, default="general")
    priority = Column(String(20), nullable=False, default="medium")
    status = Column(String(20), nullable=False, default="open", index=True)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    user = relationship("User", foreign_keys=[user_id], lazy="selectin")
    assignee = relationship("User", foreign_keys=[assigned_to], lazy="selectin")
    messages = relationship("TicketMessage", back_populates="ticket", lazy="selectin", order_by="TicketMessage.created_at")


class TicketMessage(BaseModel):
    """Message within a support ticket."""

    __tablename__ = "ticket_messages"

    ticket_id = Column(Integer, ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    is_staff = Column(Integer, default=0, nullable=False)

    ticket = relationship("SupportTicket", back_populates="messages")
    user = relationship("User", lazy="selectin")
