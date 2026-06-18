"""Tender listing, search, and management endpoints."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models.tender import Tender
from app.models.user import User
from app.schemas.base import PaginatedResponse, SuccessResponse
from app.schemas.tender import TenderDetail, TenderFilter, TenderListItem
from app.services.tender_service import TenderService

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[TenderListItem])
async def list_tenders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    region: Optional[str] = None,
    status: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    source: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List tenders with filtering and pagination."""
    service = TenderService(db)
    filters = TenderFilter(
        category=category,
        region=region,
        status=status,
        min_amount=min_amount,
        max_amount=max_amount,
        source=source,
        search=search,
    )
    items, total = await service.get_tenders(
        filters, skip=(page - 1) * per_page, limit=per_page
    )
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


@router.get("/{tender_id}", response_model=SuccessResponse[TenderDetail])
async def get_tender(
    tender_id: int,
    user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Get tender details with optional match info."""
    service = TenderService(db)
    company_id = user.company.id if user and user.company else None
    detail = await service.get_tender_detail(tender_id, company_id)
    return SuccessResponse(data=detail)


@router.get("/matched/", response_model=PaginatedResponse[dict])
async def matched_tenders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    min_score: float = Query(0.0, ge=0, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List tenders matched to the user's company."""
    service = TenderService(db)
    company_id = user.company.id if user.company else 0
    items, total = await service.get_matched_tenders(
        company_id=company_id,
        skip=(page - 1) * per_page,
        limit=per_page,
        min_score=min_score,
    )
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


@router.post("/save/{match_id}", response_model=SuccessResponse[dict])
async def toggle_save_tender(
    match_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle save/unsave a matched tender."""
    from app.models.tender_match import TenderMatch
    match = await db.get(TenderMatch, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match topilmadi")
    if not user.company or match.company_id != user.company.id:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")
    service = TenderService(db)
    is_saved = await service.toggle_save(match_id)
    return SuccessResponse(data={"is_saved": is_saved})


@router.get("/calendar/", response_model=SuccessResponse[list])
async def calendar_tenders(
    year: int = Query(..., ge=2020, le=2030),
    month: int = Query(..., ge=1, le=12),
    category: Optional[str] = None,
    region: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get tenders grouped by deadline date for calendar view."""
    conditions = [
        Tender.is_deleted.is_(False),
        Tender.deadline.isnot(None),
        extract("year", Tender.deadline) == year,
        extract("month", Tender.deadline) == month,
    ]
    if category:
        conditions.append(Tender.category == category)
    if region:
        conditions.append(Tender.region == region)
    if status:
        conditions.append(Tender.status == status)

    result = await db.execute(
        select(Tender).where(*conditions).order_by(Tender.deadline.asc()).limit(500)
    )
    tenders = result.scalars().all()

    by_date: dict[str, list] = {}
    for t in tenders:
        date_key = t.deadline.strftime("%Y-%m-%d")
        if date_key not in by_date:
            by_date[date_key] = []
        by_date[date_key].append({
            "id": t.id,
            "title": t.title,
            "category": t.category,
            "region": t.region,
            "status": t.status,
            "amount": t.amount,
            "organization": t.organization,
            "deadline": t.deadline.isoformat(),
        })

    return SuccessResponse(data=[
        {"date": date, "tenders": items, "count": len(items)}
        for date, items in sorted(by_date.items())
    ])


@router.get("/compare/", response_model=SuccessResponse[list])
async def compare_tenders(
    ids: str = Query(..., description="Comma-separated tender IDs, e.g. 1,2,3"),
    db: AsyncSession = Depends(get_db),
):
    """Compare up to 4 tenders side by side."""
    try:
        tender_ids = [int(x.strip()) for x in ids.split(",") if x.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="IDs must be integers")

    if len(tender_ids) < 2 or len(tender_ids) > 4:
        raise HTTPException(status_code=400, detail="2 dan 4 gacha tender tanlang")

    result = await db.execute(
        select(Tender).where(Tender.id.in_(tender_ids), Tender.is_deleted.is_(False))
    )
    tenders = result.scalars().all()

    if len(tenders) < 2:
        raise HTTPException(status_code=404, detail="Kamida 2 ta tender topilmadi")

    id_order = {tid: i for i, tid in enumerate(tender_ids)}
    tenders_sorted = sorted(tenders, key=lambda t: id_order.get(t.id, 0))

    return SuccessResponse(data=[
        {
            "id": t.id,
            "title": t.title,
            "organization": t.organization,
            "category": t.category,
            "region": t.region,
            "status": t.status,
            "amount": t.amount,
            "currency": t.currency,
            "deadline": t.deadline.isoformat() if t.deadline else None,
            "published_at": t.published_at.isoformat() if t.published_at else None,
            "requirements": t.requirements,
            "contact_info": t.contact_info,
            "url": t.url,
            "description": t.description,
        }
        for t in tenders_sorted
    ])


@router.get("/search/", response_model=PaginatedResponse[TenderListItem])
async def search_tenders(
    q: str = Query(min_length=2),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Search tenders by text query."""
    service = TenderService(db)
    items, total = await service.search_tenders(
        q, skip=(page - 1) * per_page, limit=per_page
    )
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
