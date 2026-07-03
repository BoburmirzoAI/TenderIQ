"""Competitor analysis endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import Float, String, case, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.tenders.tender import Tender
from app.models.tenders.tender_result import TenderResult
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

router = APIRouter()


@router.get("/top", response_model=SuccessResponse[list])
async def top_competitors(
    category: Optional[str] = None,
    region: Optional[str] = None,
    limit: int = Query(20, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Top competitors by win count."""
    conditions = [Tender.is_deleted.is_(False), TenderResult.winner_name.isnot(None)]
    if category:
        conditions.append(Tender.category == category)
    if region:
        conditions.append(Tender.region == region)

    result = await db.execute(
        select(
            TenderResult.winner_name,
            TenderResult.winner_stir,
            func.count().label("wins"),
            func.coalesce(func.sum(TenderResult.winning_amount), 0).label("total_amount"),
            func.coalesce(func.avg(TenderResult.winning_amount), 0).label("avg_amount"),
        )
        .join(Tender, Tender.id == TenderResult.tender_id)
        .where(*conditions)
        .group_by(TenderResult.winner_name, TenderResult.winner_stir)
        .order_by(func.count().desc())
        .limit(limit)
    )
    rows = result.all()

    return SuccessResponse(data=[
        {
            "name": r.winner_name,
            "stir": r.winner_stir,
            "wins": r.wins,
            "total_amount": float(r.total_amount),
            "avg_amount": float(r.avg_amount),
        }
        for r in rows
    ])


@router.get("/profile/{stir}", response_model=SuccessResponse[dict])
async def competitor_profile(
    stir: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Detailed competitor profile by STIR (INN)."""
    if not stir.isdigit() or len(stir) > 15:
        return SuccessResponse(data={"stir": stir, "name": None, "wins": 0})
    base = (
        select(TenderResult)
        .join(Tender, Tender.id == TenderResult.tender_id)
        .where(TenderResult.winner_stir == stir, Tender.is_deleted.is_(False))
    )

    total_wins = (
        await db.execute(select(func.count()).select_from(base.subquery()))
    ).scalar_one()

    if total_wins == 0:
        return SuccessResponse(data={"stir": stir, "name": None, "wins": 0})

    name_result = await db.execute(
        select(TenderResult.winner_name)
        .where(TenderResult.winner_stir == stir)
        .order_by(TenderResult.id.desc())
        .limit(1)
    )
    name = name_result.scalar_one_or_none() or "Noma'lum"

    stats = (
        await db.execute(
            select(
                func.coalesce(func.sum(TenderResult.winning_amount), 0).label("total"),
                func.coalesce(func.avg(TenderResult.winning_amount), 0).label("avg"),
                func.min(TenderResult.winning_amount).label("min"),
                func.max(TenderResult.winning_amount).label("max"),
            )
            .where(TenderResult.winner_stir == stir)
        )
    ).one()

    by_category = await db.execute(
        select(
            Tender.category,
            func.count().label("count"),
            func.coalesce(func.sum(TenderResult.winning_amount), 0).label("amount"),
        )
        .join(Tender, Tender.id == TenderResult.tender_id)
        .where(TenderResult.winner_stir == stir, Tender.is_deleted.is_(False))
        .group_by(Tender.category)
        .order_by(func.count().desc())
    )
    categories = [{"category": r[0] or "Boshqa", "count": r[1], "amount": float(r[2])} for r in by_category.all()]

    by_region = await db.execute(
        select(
            Tender.region,
            func.count().label("count"),
        )
        .join(Tender, Tender.id == TenderResult.tender_id)
        .where(TenderResult.winner_stir == stir, Tender.is_deleted.is_(False))
        .group_by(Tender.region)
        .order_by(func.count().desc())
    )
    regions = [{"region": r[0] or "Boshqa", "count": r[1]} for r in by_region.all()]

    recent = await db.execute(
        select(
            Tender.id,
            Tender.title,
            Tender.category,
            Tender.region,
            TenderResult.winning_amount,
            Tender.amount,
            Tender.deadline,
        )
        .join(Tender, Tender.id == TenderResult.tender_id)
        .where(TenderResult.winner_stir == stir, Tender.is_deleted.is_(False))
        .order_by(Tender.deadline.desc().nullslast())
        .limit(10)
    )
    recent_wins = [
        {
            "tender_id": r[0],
            "title": r[1],
            "category": r[2],
            "region": r[3],
            "winning_amount": float(r[4]) if r[4] else None,
            "tender_amount": float(r[5]) if r[5] else None,
            "discount_pct": round((1 - r[4] / r[5]) * 100, 1) if r[4] and r[5] and r[5] > 0 else None,
            "deadline": r[6].isoformat() if r[6] else None,
        }
        for r in recent.all()
    ]

    avg_discount = None
    if recent_wins:
        discounts = [w["discount_pct"] for w in recent_wins if w["discount_pct"] is not None]
        if discounts:
            avg_discount = round(sum(discounts) / len(discounts), 1)

    return SuccessResponse(data={
        "stir": stir,
        "name": name,
        "wins": total_wins,
        "total_amount": float(stats.total),
        "avg_amount": float(stats.avg),
        "min_amount": float(stats.min) if stats.min else None,
        "max_amount": float(stats.max) if stats.max else None,
        "avg_discount_pct": avg_discount,
        "by_category": categories,
        "by_region": regions,
        "recent_wins": recent_wins,
    })


@router.get("/tender/{tender_id}/predict", response_model=SuccessResponse[list])
async def predict_competitors(
    tender_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Predict likely competitors for a tender based on category/region history."""
    tender = await db.get(Tender, tender_id)
    if not tender:
        return SuccessResponse(data=[])

    conditions = [Tender.is_deleted.is_(False), TenderResult.winner_stir.isnot(None)]

    if tender.category:
        cat_match = case((Tender.category == tender.category, 1), else_=0)
    else:
        cat_match = func.literal(0)

    if tender.region:
        reg_match = case((Tender.region == tender.region, 1), else_=0)
    else:
        reg_match = func.literal(0)

    result = await db.execute(
        select(
            TenderResult.winner_name,
            TenderResult.winner_stir,
            func.count().label("total_wins"),
            func.sum(cat_match).label("category_wins"),
            func.sum(reg_match).label("region_wins"),
            func.coalesce(func.avg(TenderResult.winning_amount), 0).label("avg_bid"),
        )
        .join(Tender, Tender.id == TenderResult.tender_id)
        .where(*conditions)
        .group_by(TenderResult.winner_name, TenderResult.winner_stir)
        .having(func.sum(cat_match) + func.sum(reg_match) > 0)
        .order_by((func.sum(cat_match) * 2 + func.sum(reg_match)).desc())
        .limit(10)
    )
    rows = result.all()

    predictions = []
    for r in rows:
        cat_w = int(r.category_wins or 0)
        reg_w = int(r.region_wins or 0)
        total = int(r.total_wins or 0)
        score = min(round((cat_w * 2 + reg_w) / max(total, 1) * 50 + min(total, 20) * 2.5, 1), 100)

        predictions.append({
            "name": r.winner_name,
            "stir": r.winner_stir,
            "score": score,
            "total_wins": total,
            "category_wins": cat_w,
            "region_wins": reg_w,
            "avg_bid": float(r.avg_bid),
        })

    return SuccessResponse(data=predictions)
