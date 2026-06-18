"""Admin panel endpoints."""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.exceptions import NotFoundException
from app.models.audit_log import AuditLog
from app.models.user import User
from app.repositories.payment_repo import PaymentRepository
from app.repositories.subscription_repo import SubscriptionRepository
from app.repositories.tender_repo import TenderRepository
from app.repositories.user_repo import UserRepository
from app.schemas.admin import AdminStats, AdminUserRead, AdminUserUpdate
from app.schemas.base import PaginatedResponse, SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/stats", response_model=SuccessResponse[AdminStats])
async def get_admin_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get platform-wide dashboard statistics."""
    user_repo = UserRepository(db)
    tender_repo = TenderRepository(db)
    sub_repo = SubscriptionRepository(db)
    payment_repo = PaymentRepository(db)

    total_users = await user_repo.count()
    total_tenders = await tender_repo.count()
    status_counts = await tender_repo.count_by_status()
    plan_counts = await sub_repo.count_by_plan()
    total_revenue = await payment_repo.get_total_revenue()

    return SuccessResponse(
        data=AdminStats(
            total_users=total_users,
            active_users=total_users,
            total_companies=0,
            total_tenders=total_tenders,
            active_tenders=status_counts.get("active", 0),
            total_matches=0,
            total_payments=total_revenue,
            pro_subscribers=plan_counts.get("pro", 0),
            business_subscribers=plan_counts.get("business", 0),
            tenders_today=0,
            matches_today=0,
        )
    )


@router.get("/users", response_model=PaginatedResponse[AdminUserRead])
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with pagination."""
    user_repo = UserRepository(db)
    users = await user_repo.get_all(skip=(page - 1) * per_page, limit=per_page)
    total = await user_repo.count()
    total_pages = (total + per_page - 1) // per_page

    items = [AdminUserRead.model_validate(u) for u in users]
    return PaginatedResponse(
        data=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


@router.patch("/users/{user_id}", response_model=SuccessResponse[AdminUserRead])
async def update_user(
    user_id: int,
    data: AdminUserUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update user properties (admin action, audit logged)."""
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise NotFoundException("User", str(user_id))

    if user.is_superadmin and not admin.is_superadmin:
        raise HTTPException(status_code=403, detail="Superadminni faqat superadmin o'zgartira oladi")

    if user_id == admin.id and "is_admin" in (data.model_dump(exclude_unset=True)):
        raise HTTPException(status_code=403, detail="O'zingizning admin huquqingizni o'zgartira olmaysiz")

    update_data = data.model_dump(exclude_unset=True)

    if "is_admin" in update_data and not admin.is_superadmin:
        raise HTTPException(status_code=403, detail="Admin huquqini faqat superadmin berishi/olishi mumkin")

    update_data.pop("is_superadmin", None)

    updated = await user_repo.update(user_id, update_data)

    audit = AuditLog(
        user_id=admin.id,
        action="user_updated",
        resource_type="user",
        resource_id=user_id,
        details=json.dumps(update_data),
    )
    db.add(audit)
    await db.commit()

    logger.info("Admin %d updated user %d: %s", admin.id, user_id, update_data)
    return SuccessResponse(data=AdminUserRead.model_validate(updated))
