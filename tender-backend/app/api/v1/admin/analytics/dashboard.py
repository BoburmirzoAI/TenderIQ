"""Admin dashboard — platform-wide KPIs and chart data."""

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.companies.company import Company
from app.models.finance.payment import Payment
from app.models.finance.subscription import Subscription
from app.models.tenders.tender import Tender
from app.models.auth.user import User
from app.repositories.finance.payment_repo import PaymentRepository
from app.repositories.finance.subscription_repo import SubscriptionRepository
from app.repositories.tenders.tender_repo import TenderRepository
from app.repositories.auth.user_repo import UserRepository
from app.schemas.admin import DashboardKPI, PlanDistributionItem, SourceChartPoint
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/kpi", response_model=SuccessResponse[DashboardKPI])
async def get_dashboard_kpi(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Platform-wide KPI cards for admin dashboard."""
    user_repo = UserRepository(db)
    tender_repo = TenderRepository(db)
    sub_repo = SubscriptionRepository(db)
    payment_repo = PaymentRepository(db)

    today = datetime.now(timezone.utc).date()

    total_users = await user_repo.count(is_deleted=False)
    active_users = await user_repo.count(is_active=True, is_deleted=False)
    total_tenders = await tender_repo.count(is_deleted=False)
    status_counts = await tender_repo.count_by_status()
    plan_counts = await sub_repo.count_by_plan()
    total_revenue = await payment_repo.get_total_revenue()

    # Bugungi yangi foydalanuvchilar
    new_users_today_res = await db.execute(
        select(func.count()).select_from(User).where(
            func.date(User.created_at) == today
        )
    )
    new_users_today = new_users_today_res.scalar_one() or 0

    # Bugungi yangi tenderlar
    tenders_today_res = await db.execute(
        select(func.count()).select_from(Tender).where(
            func.date(Tender.created_at) == today
        )
    )
    tenders_today = tenders_today_res.scalar_one() or 0

    # Kompaniyalar soni
    companies_res = await db.execute(
        select(func.count()).select_from(Company).where(Company.is_deleted.is_(False))
    )
    total_companies = companies_res.scalar_one() or 0

    return SuccessResponse(
        data=DashboardKPI(
            total_users=total_users,
            active_users=active_users,
            total_tenders=total_tenders,
            active_tenders=status_counts.get("active", 0),
            tenders_today=tenders_today,
            pro_subscribers=plan_counts.get("pro", 0),
            business_subscribers=plan_counts.get("business", 0),
            total_revenue=total_revenue,
            new_users_today=new_users_today,
            total_companies=total_companies,
        )
    )


@router.get("/growth", response_model=SuccessResponse[list[dict]])
async def growth_chart(
    days: int = 30,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """User and tender growth over time."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    user_rows = (await db.execute(
        select(func.date(User.created_at).label("day"), func.count().label("cnt"))
        .where(User.created_at >= since)
        .group_by(func.date(User.created_at))
        .order_by(func.date(User.created_at))
    )).all()

    tender_rows = (await db.execute(
        select(func.date(Tender.created_at).label("day"), func.count().label("cnt"))
        .where(Tender.created_at >= since)
        .group_by(func.date(Tender.created_at))
        .order_by(func.date(Tender.created_at))
    )).all()

    user_map = {str(r.day): r.cnt for r in user_rows}
    tender_map = {str(r.day): r.cnt for r in tender_rows}
    all_days = sorted(set(user_map) | set(tender_map))

    chart = [
        {"day": d, "users": user_map.get(d, 0), "tenders": tender_map.get(d, 0)}
        for d in all_days
    ]
    return SuccessResponse(data=chart)


@router.get("/recent-activity", response_model=SuccessResponse[list[dict]])
async def recent_activity(
    limit: int = 20,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Recent audit log entries for the dashboard."""
    from app.models.system.audit_log import AuditLog
    rows = (await db.execute(
        select(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )).scalars().all()

    items = [
        {
            "id": r.id,
            "action": r.action,
            "resource_type": r.resource_type or "system",
            "user_id": r.user_id,
            "created_at": str(r.created_at)[:19],
        }
        for r in rows
    ]
    return SuccessResponse(data=items)


@router.get("/chart/tenders", response_model=SuccessResponse[list[SourceChartPoint]])
async def get_tender_chart(
    days: int = 30,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Tenders added per day by source for the last N days."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(
            func.date(Tender.created_at).label("day"),
            Tender.source,
            func.count().label("cnt"),
        )
        .where(Tender.created_at >= since)
        .group_by(func.date(Tender.created_at), Tender.source)
        .order_by(func.date(Tender.created_at))
    )
    rows = result.all()

    # Kunlar lug'ati tuzish
    days_map: dict[str, dict[str, int]] = {}
    for row in rows:
        day_str = str(row.day)
        if day_str not in days_map:
            days_map[day_str] = {"uzex": 0, "mc": 0, "mygov": 0}
        source = row.source.lower()
        if source in days_map[day_str]:
            days_map[day_str][source] = row.cnt

    chart = [
        SourceChartPoint(day=day, uzex=v["uzex"], mc=v["mc"], mygov=v["mygov"])
        for day, v in sorted(days_map.items())
    ]
    return SuccessResponse(data=chart)


@router.get("/chart/plans", response_model=SuccessResponse[list[PlanDistributionItem]])
async def get_plan_distribution(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Active subscription distribution by plan."""
    result = await db.execute(
        select(Subscription.plan, func.count().label("cnt"))
        .where(Subscription.is_active.is_(True))
        .group_by(Subscription.plan)
    )
    rows = result.all()

    plan_labels = {"free": "Bepul", "pro": "Pro", "business": "Business"}
    items = [
        PlanDistributionItem(name=plan_labels.get(row.plan, row.plan), value=row.cnt)
        for row in rows
    ]
    return SuccessResponse(data=items)


@router.get("/chart/revenue", response_model=SuccessResponse[list[dict]])
async def get_revenue_chart(
    days: int = 30,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Daily revenue by payment provider for the last N days."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(
            func.date(Payment.created_at).label("day"),
            Payment.provider,
            func.sum(Payment.amount).label("total"),
        )
        .where(Payment.created_at >= since, Payment.status == "completed")
        .group_by(func.date(Payment.created_at), Payment.provider)
        .order_by(func.date(Payment.created_at))
    )
    rows = result.all()

    days_map: dict[str, dict[str, float]] = {}
    for row in rows:
        day_str = str(row.day)
        if day_str not in days_map:
            days_map[day_str] = {"click": 0.0, "payme": 0.0}
        provider = row.provider.lower()
        if provider in days_map[day_str]:
            days_map[day_str][provider] = round(float(row.total or 0), 2)

    chart = [
        {"day": day, "click": v["click"], "payme": v["payme"]}
        for day, v in sorted(days_map.items())
    ]
    return SuccessResponse(data=chart)
