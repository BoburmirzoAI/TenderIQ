"""Admin financials — revenue overview, payments, subscriptions."""

import json
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.exceptions import NotFoundException
from app.models.system.audit_log import AuditLog
from app.models.finance.payment import Payment
from app.models.finance.subscription import Subscription
from app.models.auth.user import User
from app.repositories.finance.payment_repo import PaymentRepository
from app.repositories.finance.subscription_repo import SubscriptionRepository
from app.schemas.admin import (
    AdminPaymentRead,
    AdminSubscriptionRead,
    AdminSubscriptionUpdate,
    RevenueOverview,
)
from app.schemas.base import PaginatedResponse, SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/overview", response_model=SuccessResponse[RevenueOverview])
async def get_revenue_overview(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Revenue and subscription overview stats."""
    payment_repo = PaymentRepository(db)
    sub_repo = SubscriptionRepository(db)

    total_revenue = await payment_repo.get_total_revenue()
    plan_counts = await sub_repo.count_by_plan()

    completed = (await db.execute(
        select(func.count()).select_from(Payment).where(Payment.status == "completed")
    )).scalar_one() or 0

    failed = (await db.execute(
        select(func.count()).select_from(Payment).where(Payment.status == "failed")
    )).scalar_one() or 0

    pending = (await db.execute(
        select(func.count()).select_from(Payment).where(Payment.status == "pending")
    )).scalar_one() or 0

    free_count = plan_counts.get("free", 0)
    pro_count = plan_counts.get("pro", 0)
    business_count = plan_counts.get("business", 0)

    # MRR: Pro=49900, Business=99900 UZS (taxminiy)
    mrr = (pro_count * 49900 + business_count * 99900) / 1000  # so'mga o'tkazish
    arr = mrr * 12

    return SuccessResponse(
        data=RevenueOverview(
            total_revenue=total_revenue,
            completed_payments=completed,
            failed_payments=failed,
            pending_payments=pending,
            pro_subscribers=pro_count,
            business_subscribers=business_count,
            free_users=free_count,
            mrr=round(mrr, 2),
            arr=round(arr, 2),
        )
    )


@router.get("/revenue-by-plan", response_model=SuccessResponse[list])
async def revenue_by_plan(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Revenue breakdown grouped by subscription plan."""
    rows = (await db.execute(
        select(
            Subscription.plan,
            func.count(Payment.id).label("payment_count"),
            func.coalesce(func.sum(Payment.amount), 0).label("total"),
        )
        .join(Payment, Payment.user_id == Subscription.user_id, isouter=True)
        .where(Subscription.is_active.is_(True))
        .group_by(Subscription.plan)
    )).all()

    data = [
        {"plan": r.plan, "payment_count": r.payment_count, "total_revenue": float(r.total)}
        for r in rows
    ]
    return SuccessResponse(data=data)


@router.get("/payments", response_model=PaginatedResponse[AdminPaymentRead])
async def list_payments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str = Query(""),
    provider: str = Query(""),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all payments with filters."""
    stmt = select(Payment)

    if status:
        stmt = stmt.where(Payment.status == status)
    if provider:
        stmt = stmt.where(Payment.provider == provider)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one() or 0
    total_pages = (total + per_page - 1) // per_page

    stmt = stmt.order_by(Payment.id.desc()).offset((page - 1) * per_page).limit(per_page)
    payments = list((await db.execute(stmt)).scalars().all())

    items = []
    for p in payments:
        item = AdminPaymentRead.model_validate(p)
        user_res = await db.execute(
            select(User.email, User.full_name).where(User.id == p.user_id)
        )
        user_row = user_res.first()
        if user_row:
            item.user_email = user_row.email
            item.user_name = user_row.full_name
        items.append(item)

    return PaginatedResponse(
        data=items, total=total, page=page, per_page=per_page,
        total_pages=total_pages, has_next=page < total_pages, has_prev=page > 1,
    )


@router.get("/subscriptions", response_model=PaginatedResponse[AdminSubscriptionRead])
async def list_subscriptions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    plan: str = Query(""),
    is_active: str = Query(""),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all subscriptions with filters."""
    stmt = select(Subscription)

    if plan:
        stmt = stmt.where(Subscription.plan == plan)
    if is_active in ("true", "false"):
        stmt = stmt.where(Subscription.is_active.is_(is_active == "true"))

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one() or 0
    total_pages = (total + per_page - 1) // per_page

    stmt = stmt.order_by(Subscription.id.desc()).offset((page - 1) * per_page).limit(per_page)
    subs = list((await db.execute(stmt)).scalars().all())

    items = []
    for s in subs:
        item = AdminSubscriptionRead.model_validate(s)
        user_res = await db.execute(
            select(User.email, User.full_name).where(User.id == s.user_id)
        )
        user_row = user_res.first()
        if user_row:
            item.user_email = user_row.email
            item.user_name = user_row.full_name
        items.append(item)

    return PaginatedResponse(
        data=items, total=total, page=page, per_page=per_page,
        total_pages=total_pages, has_next=page < total_pages, has_prev=page > 1,
    )


@router.patch("/subscriptions/{sub_id}", response_model=SuccessResponse[AdminSubscriptionRead])
async def update_subscription(
    sub_id: int,
    data: AdminSubscriptionUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Manually update a user subscription (plan, expiry, status)."""
    sub_repo = SubscriptionRepository(db)
    sub = await sub_repo.get_by_id(sub_id)
    if not sub:
        raise NotFoundException("Subscription", str(sub_id))

    update_data = data.model_dump(exclude_unset=True)
    updated = await sub_repo.update(sub_id, update_data)

    db.add(AuditLog(
        user_id=admin.id,
        action="subscription_updated",
        resource_type="subscription",
        resource_id=sub_id,
        details=json.dumps({k: str(v) for k, v in update_data.items()}),
    ))
    await db.commit()

    item = AdminSubscriptionRead.model_validate(updated)
    user_res = await db.execute(
        select(User.email, User.full_name).where(User.id == updated.user_id)
    )
    user_row = user_res.first()
    if user_row:
        item.user_email = user_row.email
        item.user_name = user_row.full_name

    return SuccessResponse(data=item)


@router.post("/subscriptions/{user_id}/grant", response_model=SuccessResponse[dict])
async def grant_subscription(
    user_id: int,
    plan: str = Query(..., description="pro | business"),
    days: int = Query(30, ge=1, le=365),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Grant a subscription to a user (admin gift)."""
    if plan not in ("pro", "business"):
        raise HTTPException(status_code=400, detail="Plan: pro yoki business bo'lishi kerak")

    sub_repo = SubscriptionRepository(db)
    await sub_repo.deactivate_all_for_user(user_id)

    now = datetime.now(timezone.utc)
    new_sub = Subscription(
        user_id=user_id,
        plan=plan,
        is_active=True,
        starts_at=now,
        expires_at=now + timedelta(days=days),
    )
    db.add(new_sub)
    db.add(AuditLog(
        user_id=admin.id,
        action="subscription_granted",
        resource_type="user",
        resource_id=user_id,
        details=json.dumps({"plan": plan, "days": days}),
    ))
    await db.commit()
    return SuccessResponse(
        data={"plan": plan, "days": days},
        message=f"{plan} obunasi {days} kunlik berildi",
    )
