"""Report generation endpoints — PDF and Excel export."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.companies.company import Company
from app.models.tenders.tender import Tender
from app.models.tenders.tender_application import TenderApplication
from app.models.auth.user import User
from app.schemas.reports.report import ReportFormat, ReportType
from app.services.reports.report_service import ReportService

router = APIRouter()

CONTENT_TYPES = {
    ReportFormat.pdf: "application/pdf",
    ReportFormat.excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
FILE_EXTENSIONS = {
    ReportFormat.pdf: "pdf",
    ReportFormat.excel: "xlsx",
}


@router.get("/tenders")
async def export_tenders(
    format: ReportFormat = Query(ReportFormat.pdf),
    category: Optional[str] = None,
    region: Optional[str] = None,
    status: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export tenders list as PDF or Excel."""
    company = await _get_company(db, user.id)
    company_name = company.name if company else "—"

    conditions = [Tender.is_deleted.is_(False)]
    if category:
        conditions.append(Tender.category == category)
    if region:
        conditions.append(Tender.region == region)
    if status:
        conditions.append(Tender.status == status)
    if min_amount is not None:
        conditions.append(Tender.amount >= min_amount)
    if max_amount is not None:
        conditions.append(Tender.amount <= max_amount)

    result = await db.execute(
        select(Tender).where(*conditions).order_by(Tender.created_at.desc()).limit(500)
    )
    tenders = result.scalars().all()

    tender_dicts = [
        {
            "title": t.title,
            "category": t.category or "",
            "region": t.region or "",
            "amount": t.amount or 0,
            "status": t.status,
            "deadline": t.deadline.strftime("%Y-%m-%d") if t.deadline else "",
            "score": 0,
        }
        for t in tenders
    ]

    service = ReportService()
    if format == ReportFormat.pdf:
        data = await service.generate_pdf_report(tender_dicts, company_name)
    else:
        data = await service.generate_tenders_excel(tender_dicts, company_name)

    filename = f"tenders_{datetime.now().strftime('%Y%m%d')}.{FILE_EXTENSIONS[format]}"
    return Response(
        content=data,
        media_type=CONTENT_TYPES[format],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/applications")
async def export_applications(
    format: ReportFormat = Query(ReportFormat.pdf),
    stage: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export applications pipeline as PDF or Excel."""
    company = await _get_company(db, user.id)
    company_name = company.name if company else "—"

    stmt = select(TenderApplication).where(TenderApplication.user_id == user.id)
    if stage:
        stmt = stmt.where(TenderApplication.stage == stage)
    stmt = stmt.order_by(TenderApplication.updated_at.desc()).limit(500)

    result = await db.execute(stmt)
    apps = result.scalars().all()

    app_dicts = []
    for a in apps:
        tender = await db.get(Tender, a.tender_id)
        app_dicts.append(
            {
                "tender_title": tender.title if tender else "—",
                "stage": a.stage,
                "priority": a.priority,
                "bid_amount": a.bid_amount,
                "win_probability": a.win_probability,
                "result": a.result,
                "submitted_at": a.submitted_at.strftime("%Y-%m-%d") if a.submitted_at else "",
            }
        )

    service = ReportService()
    if format == ReportFormat.pdf:
        data = await service.generate_applications_pdf(app_dicts, company_name)
    else:
        data = await service.generate_applications_excel(app_dicts, company_name)

    filename = f"applications_{datetime.now().strftime('%Y%m%d')}.{FILE_EXTENSIONS[format]}"
    return Response(
        content=data,
        media_type=CONTENT_TYPES[format],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/analytics")
async def export_analytics(
    format: ReportFormat = Query(ReportFormat.pdf),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export analytics summary as PDF or Excel."""
    company = await _get_company(db, user.id)
    company_name = company.name if company else "—"

    total_tenders = (
        await db.execute(
            select(func.count()).select_from(Tender).where(Tender.is_deleted.is_(False))
        )
    ).scalar_one()

    active_tenders = (
        await db.execute(
            select(func.count())
            .select_from(Tender)
            .where(Tender.is_deleted.is_(False), Tender.status == "active")
        )
    ).scalar_one()

    total_apps = (
        await db.execute(
            select(func.count())
            .select_from(TenderApplication)
            .where(TenderApplication.user_id == user.id)
        )
    ).scalar_one()

    won = (
        await db.execute(
            select(func.count())
            .select_from(TenderApplication)
            .where(TenderApplication.user_id == user.id, TenderApplication.result == "won")
        )
    ).scalar_one()

    total_amount = (
        await db.execute(
            select(func.coalesce(func.sum(TenderApplication.bid_amount), 0)).where(
                TenderApplication.user_id == user.id, TenderApplication.result == "won"
            )
        )
    ).scalar_one()

    decided = (
        await db.execute(
            select(func.count())
            .select_from(TenderApplication)
            .where(
                TenderApplication.user_id == user.id,
                TenderApplication.result.in_(["won", "lost"]),
            )
        )
    ).scalar_one()

    stats = {
        "total_tenders": total_tenders,
        "active_tenders": active_tenders,
        "total_applications": total_apps,
        "won_tenders": won,
        "win_rate": round(won / decided * 100, 1) if decided > 0 else 0,
        "total_amount": float(total_amount),
    }

    service = ReportService()
    if format == ReportFormat.pdf:
        data = await service.generate_analytics_pdf(stats, company_name)
    else:
        by_category = await _group_tenders(db, Tender.category, "category")
        by_region = await _group_tenders(db, Tender.region, "region")
        data = await service.generate_analytics_excel(stats, by_category, by_region, company_name)

    filename = f"analytics_{datetime.now().strftime('%Y%m%d')}.{FILE_EXTENSIONS[format]}"
    return Response(
        content=data,
        media_type=CONTENT_TYPES[format],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _get_company(db: AsyncSession, user_id: int) -> Optional[Company]:
    result = await db.execute(select(Company).where(Company.user_id == user_id))
    return result.scalar_one_or_none()


async def _group_tenders(db: AsyncSession, column, key_name: str) -> list[dict]:
    result = await db.execute(
        select(column, func.count().label("count"), func.coalesce(func.sum(Tender.amount), 0).label("total_amount"))
        .where(Tender.is_deleted.is_(False), column.isnot(None))
        .group_by(column)
        .order_by(func.count().desc())
        .limit(20)
    )
    return [{key_name: row[0], "count": row[1], "total_amount": float(row[2])} for row in result.all()]
