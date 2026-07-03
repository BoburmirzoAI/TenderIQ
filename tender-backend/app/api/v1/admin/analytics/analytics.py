"""Admin analytics — overview, retention, pipeline stats."""

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.finance.subscription import Subscription
from app.models.tenders.tender import Tender
from app.models.tenders.tender_match import TenderMatch
from app.models.tenders.tender_application import TenderApplication
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/overview", response_model=SuccessResponse[dict])
async def get_analytics_overview(
    days: int = Query(30, ge=7, le=365),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """High-level analytics for the last N days."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # Yangi foydalanuvchilar
    new_users = (await db.execute(
        select(func.count()).select_from(User).where(User.created_at >= since)
    )).scalar_one() or 0

    # Yangi tenderlar
    new_tenders = (await db.execute(
        select(func.count()).select_from(Tender).where(
            Tender.created_at >= since, Tender.is_deleted.is_(False)
        )
    )).scalar_one() or 0

    # Yangi matchlar
    new_matches = (await db.execute(
        select(func.count()).select_from(TenderMatch).where(TenderMatch.created_at >= since)
    )).scalar_one() or 0

    # Konvertatsiya: bepul → to'lovli
    paid_users = (await db.execute(
        select(func.count(User.id.distinct())).select_from(User).join(
            Subscription,
            (Subscription.user_id == User.id)
            & Subscription.is_active.is_(True)
            & Subscription.plan.in_(["pro", "business"]),
        ).where(User.created_at >= since)
    )).scalar_one() or 0

    conversion_rate = round((paid_users / new_users * 100) if new_users > 0 else 0, 1)

    # Kunlik breakdown
    daily_users = await db.execute(
        select(func.date(User.created_at).label("day"), func.count().label("cnt"))
        .where(User.created_at >= since)
        .group_by(func.date(User.created_at))
        .order_by(func.date(User.created_at))
    )
    daily_tenders = await db.execute(
        select(func.date(Tender.created_at).label("day"), func.count().label("cnt"))
        .where(Tender.created_at >= since, Tender.is_deleted.is_(False))
        .group_by(func.date(Tender.created_at))
        .order_by(func.date(Tender.created_at))
    )

    return SuccessResponse(data={
        "period_days": days,
        "new_users": new_users,
        "new_tenders": new_tenders,
        "new_matches": new_matches,
        "paid_conversions": paid_users,
        "conversion_rate": conversion_rate,
        "daily_users": [{"day": str(r.day), "count": r.cnt} for r in daily_users.all()],
        "daily_tenders": [{"day": str(r.day), "count": r.cnt} for r in daily_tenders.all()],
    })


@router.get("/retention", response_model=SuccessResponse[dict])
async def get_retention(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Simple 30/60/90 day user retention buckets."""
    now = datetime.now(timezone.utc)
    buckets = [
        ("30d", now - timedelta(days=30), now - timedelta(days=0)),
        ("60d", now - timedelta(days=60), now - timedelta(days=30)),
        ("90d", now - timedelta(days=90), now - timedelta(days=60)),
    ]
    result = {}
    for label, start, end in buckets:
        cnt = (await db.execute(
            select(func.count()).select_from(User)
            .where(User.created_at >= start, User.created_at < end, User.is_active.is_(True))
        )).scalar_one() or 0
        result[label] = cnt

    return SuccessResponse(data=result)


@router.get("/pipeline", response_model=SuccessResponse[dict])
async def get_pipeline_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Match pipeline — saved vs notified vs total match counts."""
    total = (await db.execute(select(func.count()).select_from(TenderMatch))).scalar_one() or 0
    saved = (await db.execute(
        select(func.count()).select_from(TenderMatch).where(TenderMatch.is_saved.is_(True))
    )).scalar_one() or 0
    notified = (await db.execute(
        select(func.count()).select_from(TenderMatch).where(TenderMatch.is_notified.is_(True))
    )).scalar_one() or 0

    # Score distribution buckets
    high_score = (await db.execute(
        select(func.count()).select_from(TenderMatch).where(TenderMatch.score >= 0.8)
    )).scalar_one() or 0
    mid_score = (await db.execute(
        select(func.count()).select_from(TenderMatch).where(
            TenderMatch.score >= 0.5, TenderMatch.score < 0.8
        )
    )).scalar_one() or 0
    low_score = (await db.execute(
        select(func.count()).select_from(TenderMatch).where(TenderMatch.score < 0.5)
    )).scalar_one() or 0

    return SuccessResponse(data={
        "total": total,
        "saved": saved,
        "notified": notified,
        "score_buckets": {
            "high_0.8+": high_score,
            "mid_0.5-0.8": mid_score,
            "low_<0.5": low_score,
        },
        "save_rate": round((saved / total * 100) if total > 0 else 0, 1),
    })


@router.get("/category-breakdown", response_model=SuccessResponse[list[dict]])
async def get_category_breakdown(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Tender count by category, sorted by volume."""
    result = await db.execute(
        select(Tender.category, func.count().label("cnt"))
        .where(Tender.is_deleted.is_(False))
        .group_by(Tender.category)
        .order_by(func.count().desc())
        .limit(20)
    )
    return SuccessResponse(data=[
        {"category": row.category, "count": row.cnt}
        for row in result.all()
    ])


@router.get("/report", response_model=SuccessResponse[dict])
async def generate_report(
    type: str = Query("summary"),
    from_: str = Query(None, alias="from"),
    to: str = Query(None),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Generate period report: total tenders, users, revenue, breakdowns."""
    from app.models.finance.payment import Payment

    now = datetime.now(timezone.utc)
    try:
        start = datetime.fromisoformat(from_).replace(tzinfo=timezone.utc) if from_ else now - timedelta(days=30)
        end = datetime.fromisoformat(to).replace(tzinfo=timezone.utc) if to else now
    except ValueError:
        start = now - timedelta(days=30)
        end = now

    total_tenders = (await db.execute(
        select(func.count()).where(Tender.is_deleted.is_(False)).where(Tender.created_at.between(start, end))
    )).scalar_one()

    total_users = (await db.execute(
        select(func.count()).select_from(User).where(User.created_at.between(start, end))
    )).scalar_one()

    # Revenue
    revenue_rows = (await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.status == "completed")
        .where(Payment.created_at.between(start, end))
    )).scalar_one() or 0

    # New users per day
    user_daily = (await db.execute(
        select(func.date(User.created_at).label("d"), func.count().label("cnt"))
        .where(User.created_at.between(start, end))
        .group_by(func.date(User.created_at))
        .order_by(func.date(User.created_at))
    )).all()

    # Tender by source
    source_rows = (await db.execute(
        select(Tender.source, func.count().label("cnt"))
        .where(Tender.is_deleted.is_(False))
        .where(Tender.created_at.between(start, end))
        .group_by(Tender.source)
        .order_by(func.count().desc())
    )).all()

    # Revenue by plan
    plan_rows = (await db.execute(
        select(Payment.plan, func.sum(Payment.amount).label("total"))
        .where(Payment.status == "completed")
        .where(Payment.created_at.between(start, end))
        .group_by(Payment.plan)
    )).all()

    return SuccessResponse(data={
        "period": f"{start.date()} – {end.date()}",
        "total_tenders": total_tenders,
        "total_users": total_users,
        "total_revenue": float(revenue_rows),
        "new_users": [{"label": str(r.d), "value": r.cnt} for r in user_daily],
        "tender_by_source": [{"label": r.source, "value": r.cnt} for r in source_rows],
        "revenue_by_plan": [{"label": r.plan or "unknown", "value": float(r.total or 0)} for r in plan_rows],
    })


@router.get("/region-breakdown", response_model=SuccessResponse[list[dict]])
async def get_region_breakdown(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Tender count by region."""
    result = await db.execute(
        select(Tender.region, func.count().label("cnt"))
        .where(Tender.is_deleted.is_(False), Tender.region.isnot(None))
        .group_by(Tender.region)
        .order_by(func.count().desc())
        .limit(20)
    )
    return SuccessResponse(data=[
        {"region": row.region, "count": row.cnt}
        for row in result.all()
    ])


@router.get("/tender-amounts", response_model=SuccessResponse[dict])
async def get_tender_amounts(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Tender amount statistics."""
    result = await db.execute(
        select(
            func.count().label("total"),
            func.coalesce(func.sum(Tender.amount), 0).label("total_amount"),
            func.coalesce(func.avg(Tender.amount), 0).label("avg_amount"),
            func.coalesce(func.max(Tender.amount), 0).label("max_amount"),
            func.coalesce(func.min(Tender.amount), 0).label("min_amount"),
        ).where(Tender.is_deleted.is_(False), Tender.amount.isnot(None))
    )
    row = result.one()

    by_status = await db.execute(
        select(Tender.status, func.count().label("cnt"), func.coalesce(func.sum(Tender.amount), 0).label("amt"))
        .where(Tender.is_deleted.is_(False))
        .group_by(Tender.status)
        .order_by(func.count().desc())
    )

    return SuccessResponse(data={
        "total_tenders": row.total,
        "total_amount": float(row.total_amount),
        "avg_amount": round(float(row.avg_amount)),
        "max_amount": float(row.max_amount),
        "min_amount": float(row.min_amount),
        "by_status": [{"status": r.status, "count": r.cnt, "amount": float(r.amt)} for r in by_status.all()],
    })


@router.get("/applications-summary", response_model=SuccessResponse[dict])
async def get_applications_summary(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Application pipeline: stages, win/loss, amounts."""
    by_stage = await db.execute(
        select(TenderApplication.stage, func.count().label("cnt"))
        .group_by(TenderApplication.stage)
        .order_by(func.count().desc())
    )

    by_result = await db.execute(
        select(TenderApplication.result, func.count().label("cnt"))
        .where(TenderApplication.result.isnot(None))
        .group_by(TenderApplication.result)
    )

    total_bid = (await db.execute(
        select(func.coalesce(func.sum(TenderApplication.bid_amount), 0))
        .where(TenderApplication.bid_amount.isnot(None))
    )).scalar_one() or 0

    won_amount = (await db.execute(
        select(func.coalesce(func.sum(TenderApplication.bid_amount), 0))
        .where(TenderApplication.result == "won")
    )).scalar_one() or 0

    avg_probability = (await db.execute(
        select(func.avg(TenderApplication.win_probability))
        .where(TenderApplication.win_probability.isnot(None))
    )).scalar_one() or 0

    return SuccessResponse(data={
        "by_stage": [{"stage": r.stage, "count": r.cnt} for r in by_stage.all()],
        "by_result": [{"result": r.result, "count": r.cnt} for r in by_result.all()],
        "total_bid_amount": float(total_bid),
        "won_amount": float(won_amount),
        "avg_win_probability": round(float(avg_probability), 1),
    })


@router.get("/source-breakdown", response_model=SuccessResponse[list[dict]])
async def get_source_breakdown(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Tender count by source."""
    result = await db.execute(
        select(Tender.source, func.count().label("cnt"))
        .where(Tender.is_deleted.is_(False))
        .group_by(Tender.source)
        .order_by(func.count().desc())
    )
    return SuccessResponse(data=[
        {"source": row.source, "count": row.cnt}
        for row in result.all()
    ])
