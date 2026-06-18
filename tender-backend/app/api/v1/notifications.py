"""Notification endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.notification_repo import NotificationRepository
from app.schemas.base import PaginatedResponse, SuccessResponse
from app.schemas.notification import NotificationRead, NotificationStats

router = APIRouter()


@router.get("", response_model=PaginatedResponse[NotificationRead])
async def list_notifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    unread_only: bool = Query(False),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List current user's notifications."""
    repo = NotificationRepository(db)
    skip = (page - 1) * per_page
    notifications = await repo.get_user_notifications(
        user.id, skip=skip, limit=per_page, unread_only=unread_only
    )
    total = await repo.count_user_total(user.id)
    total_pages = (total + per_page - 1) // per_page

    return PaginatedResponse(
        data=[NotificationRead.model_validate(n) for n in notifications],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


@router.get("/stats", response_model=SuccessResponse[NotificationStats])
async def get_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get notification counts."""
    repo = NotificationRepository(db)
    total = await repo.count_user_total(user.id)
    unread = await repo.count_unread(user.id)
    return SuccessResponse(data=NotificationStats(total=total, unread=unread))


@router.patch("/{notification_id}/read", response_model=SuccessResponse[dict])
async def mark_read(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a single notification as read."""
    repo = NotificationRepository(db)
    success = await repo.mark_read(notification_id, user.id)
    return SuccessResponse(data={"success": success})


@router.patch("/read-all", response_model=SuccessResponse[dict])
async def mark_all_read(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read."""
    repo = NotificationRepository(db)
    count = await repo.mark_all_read(user.id)
    return SuccessResponse(data={"marked": count})
