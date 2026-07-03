"""Admin API keys — manage programmatic access keys."""

import json
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.system.api_key import APIKey
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class APIKeyRead(BaseModel):
    id: int
    user_id: int
    user_email: Optional[str] = None
    name: str
    key_prefix: str
    scopes: List[str] = []
    last_used_at: Optional[str] = None
    expires_at: Optional[str] = None
    is_active: bool
    created_at: str


class APIKeyCreate(BaseModel):
    user_id: int
    name: str
    scopes: List[str] = []
    expires_at: Optional[str] = None


class APIKeyCreated(APIKeyRead):
    full_key: str


def _to_read(k: APIKey, email: Optional[str] = None) -> APIKeyRead:
    scopes = []
    if k.scopes:
        try:
            scopes = json.loads(k.scopes)
        except (json.JSONDecodeError, TypeError) as e:
            logger.error("Corrupted scopes data for api_key %d — stored value: %r — error: %s", k.id, k.scopes, e)
            scopes = []
    return APIKeyRead(
        id=k.id, user_id=k.user_id, user_email=email, name=k.name,
        key_prefix=k.key_prefix, scopes=scopes,
        last_used_at=str(k.last_used_at)[:19] if k.last_used_at else None,
        expires_at=str(k.expires_at)[:10] if k.expires_at else None,
        is_active=k.is_active,
        created_at=str(k.created_at)[:10],
    )


@router.get("", response_model=SuccessResponse[List[APIKeyRead]])
async def list_api_keys(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(
        select(APIKey, User.email)
        .join(User, User.id == APIKey.user_id, isouter=True)
        .order_by(APIKey.created_at.desc())
    )).all()
    return SuccessResponse(data=[_to_read(k, email) for k, email in rows])


@router.post("", response_model=SuccessResponse[APIKeyCreated])
async def create_api_key(
    data: APIKeyCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone
    full_key, prefix, key_hash = APIKey.generate()
    expires_dt = None
    if data.expires_at:
        try:
            expires_dt = datetime.fromisoformat(data.expires_at.replace("Z", "+00:00"))
        except ValueError:
            try:
                expires_dt = datetime.strptime(data.expires_at, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except ValueError:
                raise HTTPException(status_code=400, detail="expires_at format: YYYY-MM-DD or ISO 8601")

    k = APIKey(
        user_id=data.user_id,
        name=data.name,
        key_hash=key_hash,
        key_prefix=prefix,
        scopes=json.dumps(data.scopes),
        expires_at=expires_dt,
        is_active=True,
    )
    db.add(k)
    await db.commit()
    await db.refresh(k)

    user_email = (await db.execute(select(User.email).where(User.id == data.user_id))).scalar_one_or_none()
    read = _to_read(k, user_email)
    return SuccessResponse(data=APIKeyCreated(**read.model_dump(), full_key=full_key), message="Kalit yaratildi — uni hozir saqlang, boshqa ko'rsatilmaydi")


@router.patch("/{key_id}/toggle", response_model=SuccessResponse[APIKeyRead])
async def toggle_api_key(
    key_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(
        select(APIKey, User.email).join(User, User.id == APIKey.user_id, isouter=True).where(APIKey.id == key_id)
    )).one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="API kalit topilmadi")
    k, email = row
    k.is_active = not k.is_active
    await db.commit()
    await db.refresh(k)
    return SuccessResponse(data=_to_read(k, email))


@router.delete("/{key_id}", response_model=SuccessResponse[dict])
async def delete_api_key(
    key_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(APIKey).where(APIKey.id == key_id))
    k = result.scalar_one_or_none()
    if not k:
        raise HTTPException(status_code=404, detail="API kalit topilmadi")
    await db.delete(k)
    await db.commit()
    return SuccessResponse(data={"deleted": True})
