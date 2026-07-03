"""Admin documents — tender document compliance checking with real PDF analysis."""

import json
import logging
import os
import re
import uuid
from typing import Any, Dict, List, Optional

import fitz  # PyMuPDF
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.documents.document_check import DocumentCheck
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = "/app/uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

STIR_PATTERN = re.compile(r'\b\d{9}\b')
INN_PATTERN = re.compile(r'\b(?:INN|ИНН|STIR|СТИР|inn|stir)[:\s]*\d{9}\b', re.IGNORECASE)
DATE_PATTERN = re.compile(r'\b\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}\b')
AMOUNT_PATTERN = re.compile(r'\b\d{1,3}(?:[\s,]\d{3})*(?:\.\d{1,2})?\s*(?:so[\'ʻ]m|сўм|UZS|USD|EUR|sum)\b', re.IGNORECASE)
SIGNATURE_KEYWORDS = re.compile(
    r'(?:\bimzo\b|\bподпись\b|(?<!\w)M\.O\.|(?<!\w)М\.О\.|'
    r'\bmuhr\b|\bпечать\b|\bpechat\b|'
    r'\bdirektor\b|\bдиректор\b|\bbosh\s+hisobchi\b|\bглавный\s+бухгалтер\b|'
    r'\brahbar\b|\bруководитель\b|\bijrochi\b|\bисполнитель\b)',
    re.IGNORECASE
)
TENDER_KEYWORDS = re.compile(
    r'(?:\btender\b|\bтендер\b|\btanlov\b|\bkonkurs\b|\bконкурс\b|'
    r'\bshartnoma\b|\bдоговор\b|\bcontract\b|'
    r'\bariza\b|\bзаявка\b|\blot\s*\d|\bлот\s*\d|'
    r'\btexnik\w*\s+topshiriq\b|\bтехническ\w+\s+задани\w*\b|'
    r'\bnarx\s+taklif\b|\bценовое\s+предложение\b|\bbuyurtma\b|\bзаказ\b)',
    re.IGNORECASE
)
FORM_FIELD_KEYWORDS = re.compile(
    r'(?:\bto[\'ʻ]ldiring\b|\bзаполн\w*\b|\bfill\s+in\b|'
    r'(?<!\w)F\.I\.O(?!\w)|(?<!\w)Ф\.И\.О(?!\w)|'
    r'\bmanzil\b|\bадрес\b|'
    r'\btelefon\b|\bтелефон\b|'
    r'\bbank\s+rekvizit\b|\bбанковск\w+\s+реквизит\b|'
    r'\br/s\b|\bр/с\b|\bhisob\s+raqam\b|\bрасчетн\w+\s+сч[её]т\b)',
    re.IGNORECASE
)


def _analyze_pdf(content: bytes, filename: str) -> Dict[str, Any]:
    """Analyze a PDF document for tender compliance using PyMuPDF."""
    checklist = []
    missing = []

    try:
        doc = fitz.open(stream=content, filetype="pdf")
    except Exception:
        return {
            "checklist": [{"name": "PDF formatida ochish", "status": "fail"}],
            "missing": ["Fayl PDF formatida ochilmadi — buzilgan yoki noto'g'ri format"],
            "score": 0.0,
        }

    full_text = ""
    page_count = doc.page_count
    has_images = False
    image_count = 0

    for page in doc:
        full_text += page.get_text() + "\n"
        imgs = page.get_images(full=True)
        if imgs:
            has_images = True
            image_count += len(imgs)

    doc.close()
    text_lower = full_text.lower()
    text_len = len(full_text.strip())

    # 1. Hujjat turi — tender hujjatimi?
    has_tender_kw = bool(TENDER_KEYWORDS.search(full_text))
    checklist.append({
        "name": "Tender/shartnoma hujjati",
        "status": "pass" if has_tender_kw else "warn",
        "detail": "Tender kalit so'zlari topildi" if has_tender_kw else "Tender kalit so'zlari topilmadi — bu tender hujjati emasligiga o'xshaydi",
    })
    if not has_tender_kw:
        missing.append("Tender yoki shartnomaga oid kalit so'zlar topilmadi")

    # 2. STIR / INN
    has_stir_labeled = bool(INN_PATTERN.search(full_text))
    has_stir_any = bool(STIR_PATTERN.search(full_text))
    if has_stir_labeled:
        checklist.append({"name": "STIR/INN ko'rsatilgan", "status": "pass", "detail": "STIR/INN raqami aniq belgilangan"})
    elif has_stir_any:
        checklist.append({"name": "STIR/INN ko'rsatilgan", "status": "warn", "detail": "9 xonali raqam topildi, lekin STIR/INN yorlig'i yo'q"})
    else:
        checklist.append({"name": "STIR/INN ko'rsatilgan", "status": "fail"})
        missing.append("STIR/INN raqami topilmadi")

    # 3. Sana
    has_date = bool(DATE_PATTERN.search(full_text))
    checklist.append({
        "name": "Sana ko'rsatilgan",
        "status": "pass" if has_date else "fail",
    })
    if not has_date:
        missing.append("Hujjatda sana topilmadi")

    # 4. Summa / narx
    has_amount = bool(AMOUNT_PATTERN.search(full_text))
    checklist.append({
        "name": "Summa/narx ko'rsatilgan",
        "status": "pass" if has_amount else "warn",
        "detail": "Summa topildi" if has_amount else "Aniq summa/valyuta topilmadi",
    })

    # 5. Imzo joyi (matn bo'yicha)
    has_sig_text = bool(SIGNATURE_KEYWORDS.search(full_text))
    checklist.append({
        "name": "Imzo joyi mavjud",
        "status": "pass" if has_sig_text else "fail",
        "detail": "Imzo yoki direktor/rahbar so'zi topildi" if has_sig_text else "Imzo yoki mas'ul shaxs ko'rsatilmagan",
    })
    if not has_sig_text:
        missing.append("Imzo joyi yoki mas'ul shaxs topilmadi")

    # 6. Muhr/pechat — rasmlar bilan tekshirish
    stamp_likely = False
    if has_images:
        stamp_likely = image_count >= 1 and has_sig_text
    checklist.append({
        "name": "Muhr (pechat) mavjud",
        "status": "pass" if stamp_likely else "warn",
        "detail": f"{image_count} ta rasm topildi, muhr bo'lishi mumkin" if has_images else "Hujjatda rasm/muhr topilmadi",
    })
    if not stamp_likely:
        missing.append("Muhr (pechat) aniqlanmadi — qo'lda tekshiring")

    # 7. Forma maydonlari
    has_form_fields = bool(FORM_FIELD_KEYWORDS.search(full_text))
    checklist.append({
        "name": "Ariza formasi to'ldirilgan",
        "status": "pass" if has_form_fields and text_len > 500 else "warn" if has_form_fields else "fail",
        "detail": "Forma maydonlari va matn topildi" if has_form_fields and text_len > 500 else "Forma maydonlari topildi, lekin matn kam" if has_form_fields else "Forma maydonlari topilmadi",
    })
    if not has_form_fields:
        missing.append("Ariza formasi maydonlari (F.I.O, manzil, telefon, bank rekvizitlari) topilmadi")

    # 8. Sahifalar soni
    checklist.append({
        "name": f"Hujjat hajmi ({page_count} sahifa)",
        "status": "pass" if page_count >= 2 else "warn",
        "detail": f"{page_count} sahifa, {text_len} belgi",
    })

    # Score
    total = len(checklist)
    passed = sum(1 for c in checklist if c["status"] == "pass")
    warned = sum(1 for c in checklist if c["status"] == "warn")
    score = round(((passed + warned * 0.5) / total) * 100, 1) if total > 0 else 0.0

    return {"checklist": checklist, "missing": missing, "score": score}


def _analyze_non_pdf(content: bytes, filename: str, ext: str) -> Dict[str, Any]:
    """Basic analysis for non-PDF files."""
    size_kb = len(content) // 1024
    checklist = [
        {"name": "Fayl formati", "status": "warn", "detail": f"{ext.upper()} — faqat PDF hujjatlar to'liq tahlil qilinadi"},
        {"name": "Fayl hajmi", "status": "pass" if size_kb > 10 else "warn", "detail": f"{size_kb} KB"},
    ]
    missing = ["PDF formatda yuklang — to'liq tender compliance tekshiruvi faqat PDF uchun ishlaydi"]
    return {"checklist": checklist, "missing": missing, "score": 25.0}


class CheckItem(BaseModel):
    name: str
    status: str
    detail: Optional[str] = None


class DocumentCheckRead(BaseModel):
    id: int
    user_id: Optional[int] = None
    filename: str
    file_type: Optional[str] = None
    file_size_kb: Optional[int] = None
    tender_name: Optional[str] = None
    compliance_score: float
    issues_count: int
    checklist: List[CheckItem] = []
    missing_items: List[str] = []
    status: str
    stored_path: Optional[str] = None
    created_at: str


class DocumentStats(BaseModel):
    total_checks: int
    avg_compliance: float
    total_issues: int
    full_compliance: int


class DocumentCheckCreate(BaseModel):
    filename: str
    file_type: Optional[str] = None
    file_size_kb: Optional[int] = None
    tender_name: Optional[str] = None
    compliance_score: float
    issues_count: int
    checklist: List[Dict[str, Any]] = []
    missing_items: List[str] = []
    user_id: Optional[int] = None


def _to_read(d: DocumentCheck) -> DocumentCheckRead:
    checklist = []
    if d.checklist:
        try:
            checklist = [CheckItem(**item) for item in json.loads(d.checklist)]
        except (json.JSONDecodeError, TypeError, KeyError):
            checklist = []
    missing = []
    if d.missing_items:
        try:
            missing = json.loads(d.missing_items)
        except (json.JSONDecodeError, TypeError):
            missing = []
    return DocumentCheckRead(
        id=d.id, user_id=d.user_id, filename=d.filename, file_type=d.file_type,
        file_size_kb=d.file_size_kb, tender_name=d.tender_name,
        compliance_score=d.compliance_score, issues_count=d.issues_count,
        checklist=checklist, missing_items=missing, status=d.status,
        stored_path=getattr(d, 'stored_path', None),
        created_at=str(d.created_at),
    )


@router.post("/check", response_model=SuccessResponse[DocumentCheckRead])
async def check_document(
    file: UploadFile = File(...),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Upload and analyze a tender document for compliance."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Fayl nomi bo'sh")

    content = await file.read()
    size_kb = len(content) // 1024
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''

    # Save file
    stored_name = f"{uuid.uuid4().hex}.{ext}" if ext else uuid.uuid4().hex
    stored_path = os.path.join(UPLOAD_DIR, stored_name)
    with open(stored_path, "wb") as f:
        f.write(content)

    # Analyze
    if ext == "pdf":
        result = _analyze_pdf(content, file.filename)
    else:
        result = _analyze_non_pdf(content, file.filename, ext)

    issues = len(result["missing"])

    dc = DocumentCheck(
        user_id=admin.id,
        filename=file.filename,
        file_type=ext or None,
        file_size_kb=size_kb,
        compliance_score=result["score"],
        issues_count=issues,
        checklist=json.dumps(result["checklist"]),
        missing_items=json.dumps(result["missing"]),
        status="checked",
        stored_path=stored_path,
    )
    db.add(dc)
    await db.commit()
    await db.refresh(dc)
    return SuccessResponse(data=_to_read(dc))


@router.get("/{doc_id}/download")
async def download_document(
    doc_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Download a stored document."""
    result = await db.execute(select(DocumentCheck).where(DocumentCheck.id == doc_id))
    dc = result.scalar_one_or_none()
    if not dc:
        raise HTTPException(status_code=404, detail="Hujjat topilmadi")

    stored_path = getattr(dc, 'stored_path', None)
    if not stored_path or not os.path.exists(stored_path):
        raise HTTPException(status_code=404, detail="Fayl serverda topilmadi")

    return FileResponse(
        path=stored_path,
        filename=dc.filename,
        media_type="application/octet-stream",
    )


@router.get("", response_model=SuccessResponse[List[DocumentCheckRead]])
async def list_checks(
    limit: int = 50,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DocumentCheck).order_by(DocumentCheck.created_at.desc()).limit(limit))
    return SuccessResponse(data=[_to_read(d) for d in result.scalars().all()])


@router.get("/stats", response_model=SuccessResponse[DocumentStats])
async def doc_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(select(func.count(DocumentCheck.id)))).scalar_one()
    avg_comp = (await db.execute(select(func.avg(DocumentCheck.compliance_score)))).scalar_one() or 0.0
    total_issues = (await db.execute(select(func.sum(DocumentCheck.issues_count)))).scalar_one() or 0
    full = (await db.execute(
        select(func.count(DocumentCheck.id)).where(DocumentCheck.compliance_score >= 100)
    )).scalar_one()
    return SuccessResponse(data=DocumentStats(
        total_checks=total,
        avg_compliance=round(float(avg_comp), 1),
        total_issues=total_issues,
        full_compliance=full,
    ))


@router.post("", response_model=SuccessResponse[DocumentCheckRead])
async def create_check(
    data: DocumentCheckCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    dc = DocumentCheck(
        user_id=data.user_id,
        filename=data.filename,
        file_type=data.file_type,
        file_size_kb=data.file_size_kb,
        tender_name=data.tender_name,
        compliance_score=data.compliance_score,
        issues_count=data.issues_count,
        checklist=json.dumps(data.checklist),
        missing_items=json.dumps(data.missing_items),
        status="checked",
    )
    db.add(dc)
    await db.commit()
    await db.refresh(dc)
    return SuccessResponse(data=_to_read(dc))


@router.delete("/{check_id}", response_model=SuccessResponse[dict])
async def delete_check(
    check_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DocumentCheck).where(DocumentCheck.id == check_id))
    dc = result.scalar_one_or_none()
    if not dc:
        raise HTTPException(status_code=404, detail="Topilmadi")

    stored_path = getattr(dc, 'stored_path', None)
    if stored_path and os.path.exists(stored_path):
        os.remove(stored_path)

    await db.delete(dc)
    await db.commit()
    return SuccessResponse(data={"deleted": True})
