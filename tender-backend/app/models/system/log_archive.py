"""Daily container log archive metadata."""

from sqlalchemy import Column, Date, Integer, String, Text

from app.models.base import BaseModel


class LogArchive(BaseModel):
    __tablename__ = "log_archives"

    container = Column(String(50), nullable=False, index=True)
    log_date = Column(Date, nullable=False, index=True)
    file_path = Column(String(500), nullable=False)
    line_count = Column(Integer, default=0, nullable=False)
    file_size = Column(Integer, default=0, nullable=False)
    level_stats = Column(Text, nullable=True)
