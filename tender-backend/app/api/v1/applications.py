"""Tender application pipeline endpoints — track bid process stage by stage."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationRead,
    ApplicationStats,
    ApplicationUpdate,
    ApplicationWithTender,
)
from app.schemas.base import PaginatedResponse, SuccessResponse
from app.services.application_service import ApplicationService

router = APIRouter()


@router.post("/", response_model=SuccessResponse[ApplicationRead])
async def create_application(
    data: ApplicationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start tracking a tender in the pipeline."""
    service = ApplicationService(db)
    app = await service.create(user.id, data)
    return SuccessResponse(data=ApplicationRead.model_validate(app))


@router.get("/", response_model=PaginatedResponse[ApplicationWithTender])
async def list_applications(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    stage: Optional[str] = None,
    priority: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all tracked applications with tender info."""
    service = ApplicationService(db)
    items, total = await service.get_all(
        user.id, stage=stage, priority=priority, skip=(page - 1) * per_page, limit=per_page
    )
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    return PaginatedResponse(
        data=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


@router.get("/stats", response_model=SuccessResponse[ApplicationStats])
async def get_application_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get pipeline statistics."""
    service = ApplicationService(db)
    stats = await service.get_stats(user.id)
    return SuccessResponse(data=stats)


@router.get("/{app_id}", response_model=SuccessResponse[ApplicationRead])
async def get_application(
    app_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single application detail."""
    service = ApplicationService(db)
    app = await service.get_one(user.id, app_id)
    return SuccessResponse(data=ApplicationRead.model_validate(app))


@router.patch("/{app_id}", response_model=SuccessResponse[ApplicationRead])
async def update_application(
    app_id: int,
    data: ApplicationUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update application stage, priority, notes, etc."""
    service = ApplicationService(db)
    app = await service.update(user.id, app_id, data)
    return SuccessResponse(data=ApplicationRead.model_validate(app))


@router.delete("/{app_id}")
async def delete_application(
    app_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove application from pipeline."""
    service = ApplicationService(db)
    await service.delete(user.id, app_id)
    return SuccessResponse(data={"deleted": True})
