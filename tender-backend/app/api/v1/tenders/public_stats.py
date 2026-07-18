"""Public landing page statistics — no authentication required."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.companies.company import Company
from app.models.tenders.tender import Tender
from app.schemas.base import SuccessResponse

router = APIRouter()


@router.get("/stats", response_model=SuccessResponse[dict])
async def public_stats(db: AsyncSession = Depends(get_db)):
    total_res = await db.execute(
        select(func.count()).select_from(Tender).where(Tender.is_deleted.is_(False))
    )
    total_tenders = total_res.scalar_one() or 0

    active_res = await db.execute(
        select(func.count()).select_from(Tender).where(
            Tender.is_deleted.is_(False),
            Tender.status == "active",
        )
    )
    active_tenders = active_res.scalar_one() or 0

    companies_res = await db.execute(
        select(func.count()).select_from(Company).where(Company.is_deleted.is_(False))
    )
    total_companies = companies_res.scalar_one() or 0

    regions_res = await db.execute(
        select(func.count(func.distinct(Tender.region))).select_from(Tender).where(
            Tender.is_deleted.is_(False),
            Tender.region.isnot(None),
        )
    )
    regions = regions_res.scalar_one() or 0

    cat_res = await db.execute(
        select(Tender.category, func.count().label("cnt"))
        .where(Tender.is_deleted.is_(False), Tender.category.isnot(None))
        .group_by(Tender.category)
        .order_by(func.count().desc())
        .limit(10)
    )
    by_category = [{"category": r.category, "count": r.cnt} for r in cat_res.all()]

    now = datetime.now(timezone.utc)
    six_months_ago = now - timedelta(days=180)
    monthly_res = await db.execute(
        select(
            extract("year", Tender.created_at).label("yr"),
            extract("month", Tender.created_at).label("mn"),
            func.count().label("cnt"),
        )
        .where(Tender.is_deleted.is_(False), Tender.created_at >= six_months_ago)
        .group_by("yr", "mn")
        .order_by("yr", "mn")
    )
    month_names = ["", "Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"]
    monthly = [
        {"month": month_names[int(r.mn)], "count": r.cnt}
        for r in monthly_res.all()
    ]

    return SuccessResponse(data={
        "total_tenders": total_tenders,
        "active_tenders": active_tenders,
        "total_companies": total_companies,
        "regions": regions,
        "by_category": by_category,
        "monthly": monthly,
    })
