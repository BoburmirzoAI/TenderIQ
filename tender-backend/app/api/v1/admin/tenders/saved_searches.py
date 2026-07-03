"""Admin saved searches — view and manage user saved searches."""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.tenders.saved_search import SavedSearch
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class SavedSearchRead(BaseModel):
    id: int
    user_id: int
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    name: str
    filters: str
    created_at: str


class SavedSearchStats(BaseModel):
    total: int
    total_users: int
    avg_per_user: float


def _to_read(s: SavedSearch) -> SavedSearchRead:
    u = s.user
    return SavedSearchRead(
        id=s.id,
        user_id=s.user_id,
        user_email=u.email if u else None,
        user_name=u.full_name if u else None,
        name=s.name,
        filters=s.filters,
        created_at=str(s.created_at)[:10],
    )


@router.get("", response_model=SuccessResponse[List[SavedSearchRead]])
async def list_saved_searches(
    user_id: Optional[int] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(SavedSearch).order_by(SavedSearch.created_at.desc()).limit(200)
    if user_id:
        query = query.where(SavedSearch.user_id == user_id)
    result = await db.execute(query)
    return SuccessResponse(data=[_to_read(s) for s in result.scalars().all()])


@router.get("/stats", response_model=SuccessResponse[SavedSearchStats])
async def saved_search_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(select(func.count(SavedSearch.id)))).scalar_one()
    unique_users = (await db.execute(select(func.count(func.distinct(SavedSearch.user_id))))).scalar_one()
    avg = round(total / unique_users, 1) if unique_users else 0.0
    return SuccessResponse(data=SavedSearchStats(total=total, total_users=unique_users, avg_per_user=avg))


@router.delete("/{search_id}", response_model=SuccessResponse[dict])
async def delete_saved_search(
    search_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SavedSearch).where(SavedSearch.id == search_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Saqlangan qidiruv topilmadi")
    await db.delete(s)
    await db.commit()
    return SuccessResponse(data={"deleted": True})
