"""Telegram group/channel tracking model."""

from sqlalchemy import BigInteger, Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.models.base import BaseModel


class BotGroup(BaseModel):
    """Tracks Telegram groups/channels the bot is added to."""

    __tablename__ = "bot_groups"

    chat_id = Column(BigInteger, unique=True, nullable=False, index=True)
    title = Column(String(500), nullable=True)
    chat_type = Column(String(20), nullable=False)
    username = Column(String(255), nullable=True)
    member_count = Column(Integer, nullable=True)
    added_by_id = Column(BigInteger, nullable=True)
    added_by_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_activity = Column(DateTime(timezone=True), server_default=func.now())
    description = Column(Text, nullable=True)
