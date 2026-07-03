"""Contact form — public endpoint for inquiries."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.communication.contact_request import ContactRequest
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()

_rate_limit: dict = {}
RATE_LIMIT_SECONDS = 60


class ContactCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    stir: Optional[str] = Field(None, max_length=9)
    phone: str
    email: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=50)
    message: str = Field(..., min_length=10, max_length=3000)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        cleaned = v.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        if not cleaned.startswith("+998") or len(cleaned) != 13:
            raise ValueError("Telefon raqam formati: +998XXXXXXXXX")
        return cleaned


class ContactResponse(BaseModel):
    id: int
    message: str


@router.post("", response_model=SuccessResponse[ContactResponse])
async def submit_contact(
    request: Request,
    data: ContactCreate,
    db: AsyncSession = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    now = datetime.now(timezone.utc)
    last_request = _rate_limit.get(client_ip)
    if last_request and (now - last_request).total_seconds() < RATE_LIMIT_SECONDS:
        raise HTTPException(status_code=429, detail="Iltimos, 1 daqiqa kutib turing")
    _rate_limit[client_ip] = now
    req = ContactRequest(
        name=data.name,
        stir=data.stir,
        phone=data.phone,
        email=data.email,
        category=data.category,
        message=data.message,
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)

    return SuccessResponse(data=ContactResponse(
        id=req.id,
        message="Arizangiz qabul qilindi. Tez orada siz bilan bog'lanamiz.",
    ))
