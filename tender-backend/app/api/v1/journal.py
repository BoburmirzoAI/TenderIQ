"""Win/Loss Journal endpoints — track and analyze tender application outcomes."""

from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import Float as SAFloat, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.exceptions import NotFoundException
from app.models.tender import Tender
from app.models.tender_application import TenderApplication
from app.models.user import User
from app.schemas.base import SuccessResponse

router = APIRouter()


class JournalResultUpdate(BaseModel):
    result: Literal["won", "lost", "cancelled"]
    notes: str | None = None


@router.get("/entries", response_model=SuccessResponse[list])
async def journal_entries(
    result: str | None = Query(None, description="won/lost/cancelled"),
    category: str | None = Query(None),
    region: str | None = Query(None),
    date_from: str | None = Query(None, description="YYYY-MM-DD"),
    date_to: str | None = Query(None, description="YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's tender application journal with outcomes."""
    conditions = [TenderApplication.user_id == user.id]

    if result:
        conditions.append(TenderApplication.result == result)

    if category:
        conditions.append(Tender.category == category)
    if region:
        conditions.append(Tender.region == region)
    if date_from:
        conditions.append(TenderApplication.created_at >= date_from)
    if date_to:
        conditions.append(TenderApplication.created_at <= date_to + "T23:59:59")

    total_q = (
        select(func.count(TenderApplication.id))
        .join(Tender, TenderApplication.tender_id == Tender.id)
        .where(*conditions)
    )
    total = (await db.execute(total_q)).scalar() or 0

    stmt = (
        select(TenderApplication)
        .join(Tender, TenderApplication.tender_id == Tender.id)
        .options(joinedload(TenderApplication.tender))
        .where(*conditions)
        .order_by(TenderApplication.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    rows = (await db.execute(stmt)).unique().scalars().all()

    entries = []
    for app in rows:
        t = app.tender
        entries.append({
            "id": app.id,
            "tender_id": t.id,
            "tender_title": t.title,
            "organization": t.organization,
            "category": t.category,
            "region": t.region,
            "tender_amount": t.amount,
            "bid_amount": app.bid_amount,
            "currency": app.currency,
            "stage": app.stage,
            "result": app.result,
            "priority": app.priority,
            "notes": app.notes,
            "win_probability": app.win_probability,
            "submitted_at": app.submitted_at.isoformat() if app.submitted_at else None,
            "decided_at": app.decided_at.isoformat() if app.decided_at else None,
            "created_at": app.created_at.isoformat() if app.created_at else None,
        })

    return SuccessResponse(data=entries, message=f"total:{total},page:{page},pages:{(total + per_page - 1) // per_page}")


@router.patch("/entries/{entry_id}", response_model=SuccessResponse[dict])
async def update_result(
    entry_id: int,
    body: JournalResultUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the result (won/lost/cancelled) for a journal entry."""
    stmt = select(TenderApplication).where(
        TenderApplication.id == entry_id,
        TenderApplication.user_id == user.id,
    )
    app = (await db.execute(stmt)).scalar_one_or_none()
    if not app:
        raise NotFoundException("Journal entry not found")

    app.result = body.result
    app.decided_at = datetime.now(timezone.utc)
    if body.notes is not None:
        app.notes = body.notes

    await db.commit()
    await db.refresh(app)

    return SuccessResponse(data={
        "id": app.id,
        "result": app.result,
        "decided_at": app.decided_at.isoformat(),
    })


@router.get("/stats", response_model=SuccessResponse[dict])
async def journal_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get win/loss statistics for the current user."""
    base = [TenderApplication.user_id == user.id]

    # Overall counts
    counts_q = select(
        func.count(TenderApplication.id).label("total"),
        func.count(case((TenderApplication.result == "won", 1))).label("won"),
        func.count(case((TenderApplication.result == "lost", 1))).label("lost"),
        func.count(case((TenderApplication.result == "cancelled", 1))).label("cancelled"),
        func.count(case((TenderApplication.result.is_(None), 1))).label("pending"),
        func.avg(case((TenderApplication.bid_amount > 0, TenderApplication.bid_amount), else_=None).cast(SAFloat)).label("avg_bid"),
        func.sum(case((TenderApplication.result == "won", TenderApplication.bid_amount), else_=0).cast(SAFloat)).label("total_won_amount"),
    ).where(*base)
    row = (await db.execute(counts_q)).one()

    total = row.total or 0
    won = row.won or 0
    lost = row.lost or 0
    decided = won + lost
    win_rate = round((won / decided * 100) if decided > 0 else 0, 1)

    # By category
    cat_q = (
        select(
            Tender.category,
            func.count(TenderApplication.id).label("total"),
            func.count(case((TenderApplication.result == "won", 1))).label("won"),
            func.count(case((TenderApplication.result == "lost", 1))).label("lost"),
        )
        .join(Tender, TenderApplication.tender_id == Tender.id)
        .where(*base, Tender.category.isnot(None))
        .group_by(Tender.category)
        .order_by(func.count(TenderApplication.id).desc())
        .limit(10)
    )
    cat_rows = (await db.execute(cat_q)).all()

    by_category = []
    for c in cat_rows:
        cd = c.won + c.lost
        by_category.append({
            "category": c.category,
            "total": c.total,
            "won": c.won,
            "lost": c.lost,
            "win_rate": round((c.won / cd * 100) if cd > 0 else 0, 1),
        })

    # By region
    reg_q = (
        select(
            Tender.region,
            func.count(TenderApplication.id).label("total"),
            func.count(case((TenderApplication.result == "won", 1))).label("won"),
            func.count(case((TenderApplication.result == "lost", 1))).label("lost"),
        )
        .join(Tender, TenderApplication.tender_id == Tender.id)
        .where(*base, Tender.region.isnot(None))
        .group_by(Tender.region)
        .order_by(func.count(TenderApplication.id).desc())
        .limit(10)
    )
    reg_rows = (await db.execute(reg_q)).all()

    by_region = []
    for r in reg_rows:
        rd = r.won + r.lost
        by_region.append({
            "region": r.region,
            "total": r.total,
            "won": r.won,
            "lost": r.lost,
            "win_rate": round((r.won / rd * 100) if rd > 0 else 0, 1),
        })

    # Monthly trend (last 12 months)
    month_expr = func.to_char(TenderApplication.created_at, "YYYY-MM")
    monthly_q = (
        select(
            month_expr.label("month"),
            func.count(TenderApplication.id).label("total"),
            func.count(case((TenderApplication.result == "won", 1))).label("won"),
            func.count(case((TenderApplication.result == "lost", 1))).label("lost"),
        )
        .where(*base)
        .group_by(month_expr)
        .order_by(month_expr.desc())
        .limit(12)
    )
    monthly_rows = (await db.execute(monthly_q)).all()

    monthly = []
    for m in monthly_rows:
        md = m.won + m.lost
        monthly.append({
            "month": m.month,
            "total": m.total,
            "won": m.won,
            "lost": m.lost,
            "win_rate": round((m.won / md * 100) if md > 0 else 0, 1),
        })

    return SuccessResponse(data={
        "total": total,
        "won": won,
        "lost": lost,
        "cancelled": row.cancelled or 0,
        "pending": row.pending or 0,
        "win_rate": win_rate,
        "avg_bid": round(float(row.avg_bid or 0), 0),
        "total_won_amount": round(float(row.total_won_amount or 0), 0),
        "by_category": by_category,
        "by_region": by_region,
        "monthly": list(reversed(monthly)),
    })
