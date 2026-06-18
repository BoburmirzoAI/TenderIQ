"""Saved searches endpoints."""

import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.saved_search import SavedSearch
from app.models.user import User
from app.schemas.base import PaginatedResponse, SuccessResponse
from app.schemas.saved_search import SavedSearchCreate, SavedSearchRead, SavedSearchUpdate, SearchFilters

router = APIRouter()


def _to_read(s: SavedSearch) -> SavedSearchRead:
    try:
        filters = SearchFilters(**json.loads(s.filters))
    except (json.JSONDecodeError, TypeError, ValueError):
        filters = SearchFilters()
    return SavedSearchRead(
        id=s.id,
        user_id=s.user_id,
        name=s.name,
        filters=filters,
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


@router.get("/", response_model=PaginatedResponse[SavedSearchRead])
async def list_saved_searches(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's saved searches."""
    base = select(SavedSearch).where(SavedSearch.user_id == user.id)
    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()

    result = await db.execute(
        base.order_by(SavedSearch.updated_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    items = [_to_read(s) for s in result.scalars().all()]

    total_pages = (total + per_page - 1) // per_page
    return PaginatedResponse(
        data=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


@router.post("/", response_model=SuccessResponse[SavedSearchRead])
async def create_saved_search(
    body: SavedSearchCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save a search."""
    count = (
        await db.execute(
            select(func.count()).select_from(SavedSearch).where(SavedSearch.user_id == user.id)
        )
    ).scalar_one()
    if count >= 20:
        raise HTTPException(status_code=400, detail="Maksimum 20 ta saqlangan qidiruv")

    obj = SavedSearch(
        user_id=user.id,
        name=body.name,
        filters=body.filters.model_dump_json(),
    )
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return SuccessResponse(data=_to_read(obj))


@router.patch("/{search_id}", response_model=SuccessResponse[SavedSearchRead])
async def update_saved_search(
    search_id: int,
    body: SavedSearchUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a saved search."""
    obj = await db.get(SavedSearch, search_id)
    if not obj or obj.user_id != user.id:
        raise HTTPException(status_code=404, detail="Topilmadi")

    if body.name is not None:
        obj.name = body.name
    if body.filters is not None:
        obj.filters = body.filters.model_dump_json()

    await db.commit()
    await db.refresh(obj)
    return SuccessResponse(data=_to_read(obj))


@router.delete("/{search_id}", response_model=SuccessResponse[dict])
async def delete_saved_search(
    search_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a saved search."""
    obj = await db.get(SavedSearch, search_id)
    if not obj or obj.user_id != user.id:
        raise HTTPException(status_code=404, detail="Topilmadi")

    await db.delete(obj)
    await db.commit()
    return SuccessResponse(data={"deleted": True})
