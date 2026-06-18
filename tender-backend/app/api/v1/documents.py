"""Document analysis endpoints."""

import os

from fastapi import APIRouter, Depends, UploadFile

from app.config import settings
from app.dependencies import get_current_user, require_plan
from app.exceptions import ValidationException
from app.models.user import User
from app.schemas.base import SuccessResponse
from app.schemas.document import ChecklistResponse
from app.services.document_service import DocumentService
from app.services.document_checker import DocumentChecker
from app.utils.file_utils import save_upload, validate_pdf

router = APIRouter()


@router.post("/analyze", response_model=SuccessResponse[ChecklistResponse])
async def analyze_document(
    file: UploadFile,
    tender_id: int | None = None,
    user: User = Depends(require_plan("document_analysis")),
):
    """Upload and analyze a tender PDF document (Pro+ only)."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise ValidationException("Only PDF files are accepted")

    file_path = await save_upload(file, settings.UPLOAD_DIR, max_size=settings.max_upload_bytes)

    try:
        validate_pdf(file_path, settings.max_upload_bytes)
        service = DocumentService()
        checklist = await service.generate_checklist(
            file_path=file_path,
            tender_title=file.filename,
            tender_id=tender_id,
        )
        return SuccessResponse(data=checklist)
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


@router.post("/check", response_model=SuccessResponse[dict])
async def check_document(
    file: UploadFile,
    user: User = Depends(get_current_user),
):
    """Rule-based tender document checker — no AI, works for all plans."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise ValidationException("Faqat PDF fayllar qabul qilinadi")

    file_path = await save_upload(file, settings.UPLOAD_DIR, max_size=settings.max_upload_bytes)

    try:
        validate_pdf(file_path, settings.max_upload_bytes)
        checker = DocumentChecker()
        result = checker.analyze(file_path)
        result["filename"] = file.filename
        return SuccessResponse(data=result)
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
