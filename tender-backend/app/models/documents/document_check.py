"""Document compliance check model."""

from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, Text

from app.models.base import BaseModel


class DocumentCheck(BaseModel):
    __tablename__ = "document_checks"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    filename = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=True)
    file_size_kb = Column(Integer, nullable=True)
    tender_name = Column(String(500), nullable=True)
    compliance_score = Column(Float, nullable=False, default=0.0)
    issues_count = Column(Integer, nullable=False, default=0)
    checklist = Column(Text, nullable=True)     # JSON list of {name, status}
    missing_items = Column(Text, nullable=True)  # JSON list of strings
    status = Column(String(20), nullable=False, default="checked")  # checking | checked | uploaded | error
    stored_path = Column(String(1000), nullable=True)
