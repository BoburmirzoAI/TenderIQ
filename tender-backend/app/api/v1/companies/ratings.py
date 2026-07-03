"""Company ratings — public rating system for organizations."""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.auth.user import User
from app.models.companies.company import Company
from app.models.companies.rating import CompanyRating
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class RatingRead(BaseModel):
    id: int
    company_id: int
    company_name: Optional[str] = None
    stir: Optional[str] = None
    category: str
    score: float
    grade: str
    wins: int
    losses: int
    total_bids: int
    total_contract_amount: float
    region: Optional[str] = None


class RatingStatsResponse(BaseModel):
    total_rated: int
    by_grade: dict
    by_category: dict
    top_regions: dict


GRADE_THRESHOLDS = [
    (90, "A"),
    (75, "BBB"),
    (60, "BB"),
    (45, "B"),
    (30, "CCC"),
    (15, "CC"),
    (0, "D"),
]


def calculate_grade(score: float) -> str:
    for threshold, grade in GRADE_THRESHOLDS:
        if score >= threshold:
            return grade
    return "D"


@router.get("", response_model=SuccessResponse[List[RatingRead]])
async def list_ratings(
    category: Optional[str] = None,
    region: Optional[str] = None,
    grade: Optional[str] = None,
    sort_by: str = Query("score", pattern="^(score|wins|total_contract_amount)$"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(CompanyRating)

    if category:
        query = query.where(CompanyRating.category == category)
    if region:
        query = query.where(CompanyRating.region == region)
    if grade:
        query = query.where(CompanyRating.grade == grade)

    sort_col = getattr(CompanyRating, sort_by)
    query = query.order_by(sort_col.desc()).offset((page - 1) * size).limit(size)

    result = await db.execute(query)
    ratings = result.scalars().all()

    return SuccessResponse(data=[
        RatingRead(
            id=r.id,
            company_id=r.company_id,
            company_name=r.company.name if r.company else None,
            stir=r.company.stir if r.company else None,
            category=r.category,
            score=r.score,
            grade=r.grade,
            wins=r.wins,
            losses=r.losses,
            total_bids=r.total_bids,
            total_contract_amount=r.total_contract_amount,
            region=r.region,
        )
        for r in ratings
    ])


@router.get("/categories")
async def rating_categories(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CompanyRating.category, func.count(CompanyRating.id))
        .group_by(CompanyRating.category)
        .order_by(func.count(CompanyRating.id).desc())
    )
    categories = [{"name": row[0], "count": row[1]} for row in result.all()]
    return SuccessResponse(data=categories)


@router.get("/stats", response_model=SuccessResponse[RatingStatsResponse])
async def rating_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(select(func.count(CompanyRating.id)))).scalar_one()

    grade_result = await db.execute(
        select(CompanyRating.grade, func.count(CompanyRating.id))
        .group_by(CompanyRating.grade)
    )
    by_grade = {row[0]: row[1] for row in grade_result.all()}

    cat_result = await db.execute(
        select(CompanyRating.category, func.count(CompanyRating.id))
        .group_by(CompanyRating.category)
        .order_by(func.count(CompanyRating.id).desc())
        .limit(10)
    )
    by_category = {row[0]: row[1] for row in cat_result.all()}

    region_result = await db.execute(
        select(CompanyRating.region, func.count(CompanyRating.id))
        .where(CompanyRating.region.isnot(None))
        .group_by(CompanyRating.region)
        .order_by(func.count(CompanyRating.id).desc())
        .limit(10)
    )
    top_regions = {row[0]: row[1] for row in region_result.all()}

    return SuccessResponse(data=RatingStatsResponse(
        total_rated=total,
        by_grade=by_grade,
        by_category=by_category,
        top_regions=top_regions,
    ))


@router.get("/company/{company_id}", response_model=SuccessResponse[List[RatingRead]])
async def company_ratings(
    company_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CompanyRating)
        .where(CompanyRating.company_id == company_id)
        .order_by(CompanyRating.score.desc())
    )
    ratings = result.scalars().all()
    return SuccessResponse(data=[
        RatingRead(
            id=r.id,
            company_id=r.company_id,
            company_name=r.company.name if r.company else None,
            stir=r.company.stir if r.company else None,
            category=r.category,
            score=r.score,
            grade=r.grade,
            wins=r.wins,
            losses=r.losses,
            total_bids=r.total_bids,
            total_contract_amount=r.total_contract_amount,
            region=r.region,
        )
        for r in ratings
    ])
