"""Document analysis schemas."""

from typing import Optional

from pydantic import BaseModel


class DocumentAnalyzeRequest(BaseModel):
    """Request to analyze a tender document."""

    tender_id: Optional[int] = None
    document_url: Optional[str] = None


class ChecklistItem(BaseModel):
    """Single checklist item from document analysis."""

    requirement: str
    is_mandatory: bool
    category: str
    notes: Optional[str] = None


class ChecklistResponse(BaseModel):
    """Full checklist extracted from document analysis."""

    tender_id: Optional[int] = None
    filename: str
    total_pages: int
    checklist: list[ChecklistItem]
    summary: str
    key_dates: list[dict[str, str]]
    required_documents: list[str]
    estimated_budget: Optional[float] = None


class ReportRequest(BaseModel):
    """Request to generate a tender report."""

    tender_ids: list[int]
    include_competitors: bool = True
    include_predictions: bool = True
    format: str = "pdf"
