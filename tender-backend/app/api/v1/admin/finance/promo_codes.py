"""Admin promo codes — CRUD for discount promo codes."""

import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.finance.promo_code import PromoCode
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class PromoCodeRead(BaseModel):
    id: int
    code: str
    discount_type: str
    discount_value: float
    plan: str
    max_uses: int
    used_count: int
    expires_at: Optional[str] = None
    is_active: bool
    description: Optional[str] = None
    created_at: str
    updated_at: str
    model_config = {"from_attributes": True}


class PromoCodeCreate(BaseModel):
    code: str
    discount_type: str  # percent | fixed
    discount_value: float
    plan: str = "all"
    max_uses: int = 100
    expires_at: Optional[str] = None
    description: Optional[str] = None

    @field_validator("discount_type")
    @classmethod
    def validate_discount_type(cls, v: str) -> str:
        if v not in ("percent", "fixed"):
            raise ValueError("discount_type must be 'percent' or 'fixed'")
        return v

    @field_validator("discount_value")
    @classmethod
    def validate_discount_value(cls, v: float, info) -> float:
        if v <= 0:
            raise ValueError("discount_value must be greater than 0")
        discount_type = info.data.get("discount_type")
        if discount_type == "percent" and v > 100:
            raise ValueError("Percent discount cannot exceed 100%")
        return v

    @field_validator("max_uses")
    @classmethod
    def validate_max_uses(cls, v: int) -> int:
        if v < 1:
            raise ValueError("max_uses must be at least 1")
        return v


class PromoCodeStats(BaseModel):
    total: int
    active: int
    expired: int
    exhausted: int
    total_uses: int


# ── Helper ────────────────────────────────────────────────────────────────────

def _to_read(p: PromoCode) -> PromoCodeRead:
    return PromoCodeRead(
        id=p.id,
        code=p.code,
        discount_type=p.discount_type,
        discount_value=p.discount_value,
        plan=p.plan,
        max_uses=p.max_uses,
        used_count=p.used_count,
        expires_at=str(p.expires_at)[:10] if p.expires_at else None,
        is_active=p.is_active,
        description=p.description,
        created_at=str(p.created_at)[:10],
        updated_at=str(p.updated_at)[:10],
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=SuccessResponse[List[PromoCodeRead]])
async def list_promo_codes(
    status: Optional[str] = None,
    plan: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(PromoCode).order_by(PromoCode.created_at.desc())
    if status == "active":
        query = query.where(PromoCode.is_active == True)
    elif status == "inactive":
        query = query.where(PromoCode.is_active == False)
    if plan and plan != "all":
        query = query.where(PromoCode.plan == plan)
    result = await db.execute(query)
    return SuccessResponse(data=[_to_read(p) for p in result.scalars().all()])


@router.get("/stats", response_model=SuccessResponse[PromoCodeStats])
async def promo_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PromoCode))
    codes = result.scalars().all()
    now = datetime.now(timezone.utc)
    active = sum(1 for c in codes if c.is_active and (not c.expires_at or c.expires_at.replace(tzinfo=timezone.utc) > now))
    expired = sum(1 for c in codes if c.expires_at and c.expires_at.replace(tzinfo=timezone.utc) <= now)
    exhausted = sum(1 for c in codes if c.used_count >= c.max_uses)
    return SuccessResponse(data=PromoCodeStats(
        total=len(codes),
        active=active,
        expired=expired,
        exhausted=exhausted,
        total_uses=sum(c.used_count for c in codes),
    ))


@router.post("", response_model=SuccessResponse[PromoCodeRead])
async def create_promo_code(
    data: PromoCodeCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(PromoCode).where(PromoCode.code == data.code.upper()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"'{data.code}' kodi allaqachon mavjud")

    expires_dt = None
    if data.expires_at:
        try:
            expires_dt = datetime.strptime(data.expires_at, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=400, detail="expires_at format: YYYY-MM-DD")

    pc = PromoCode(
        code=data.code.upper().strip(),
        discount_type=data.discount_type,
        discount_value=data.discount_value,
        plan=data.plan,
        max_uses=data.max_uses,
        used_count=0,
        expires_at=expires_dt,
        description=data.description,
        is_active=True,
    )
    db.add(pc)
    await db.commit()
    await db.refresh(pc)
    return SuccessResponse(data=_to_read(pc), message="Promo kod yaratildi")


@router.patch("/{code_id}", response_model=SuccessResponse[PromoCodeRead])
async def update_promo_code(
    code_id: int,
    data: dict,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update promo code fields."""
    result = await db.execute(select(PromoCode).where(PromoCode.id == code_id))
    pc = result.scalar_one_or_none()
    if not pc:
        raise HTTPException(status_code=404, detail="Promo kod topilmadi")
    allowed = {"is_active", "discount_value", "max_uses", "plan", "description", "expires_at"}
    for k, v in data.items():
        if k in allowed:
            setattr(pc, k, v)
    await db.commit()
    await db.refresh(pc)
    return SuccessResponse(data=_to_read(pc))


@router.post("/validate", response_model=SuccessResponse[PromoCodeRead])
async def validate_promo_code(
    data: dict,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Check if a promo code is valid."""
    code = data.get("code", "").upper().strip()
    if not code:
        raise HTTPException(status_code=400, detail="Kod kiritilmadi")
    result = await db.execute(select(PromoCode).where(PromoCode.code == code))
    pc = result.scalar_one_or_none()
    if not pc:
        raise HTTPException(status_code=404, detail="Promo kod topilmadi")
    now = datetime.now(timezone.utc)
    if not pc.is_active:
        raise HTTPException(status_code=400, detail="Promo kod faol emas")
    if pc.expires_at and pc.expires_at.replace(tzinfo=timezone.utc) <= now:
        raise HTTPException(status_code=400, detail="Promo kod muddati tugagan")
    if pc.used_count >= pc.max_uses:
        raise HTTPException(status_code=400, detail="Promo kod limiti tugagan")
    return SuccessResponse(data=_to_read(pc))


@router.patch("/{code_id}/toggle", response_model=SuccessResponse[PromoCodeRead])
async def toggle_promo_code(
    code_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PromoCode).where(PromoCode.id == code_id))
    pc = result.scalar_one_or_none()
    if not pc:
        raise HTTPException(status_code=404, detail="Promo kod topilmadi")
    pc.is_active = not pc.is_active
    await db.commit()
    await db.refresh(pc)
    return SuccessResponse(data=_to_read(pc))


@router.delete("/{code_id}", response_model=SuccessResponse[dict])
async def delete_promo_code(
    code_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PromoCode).where(PromoCode.id == code_id))
    pc = result.scalar_one_or_none()
    if not pc:
        raise HTTPException(status_code=404, detail="Promo kod topilmadi")
    await db.delete(pc)
    await db.commit()
    return SuccessResponse(data={"deleted": True})
