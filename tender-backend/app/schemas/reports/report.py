"""Report generation schemas."""

from enum import Enum
from typing import Optional

from pydantic import BaseModel


class ReportType(str, Enum):
    tenders = "tenders"
    applications = "applications"
    analytics = "analytics"


class ReportFormat(str, Enum):
    pdf = "pdf"
    excel = "excel"


class ReportRequest(BaseModel):
    """Parameters for generating a report."""

    report_type: ReportType
    format: ReportFormat = ReportFormat.pdf
    category: Optional[str] = None
    region: Optional[str] = None
    status: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None


class ReportMeta(BaseModel):
    """Report metadata returned after generation."""

    report_type: ReportType
    format: ReportFormat
    filename: str
    size_bytes: int
