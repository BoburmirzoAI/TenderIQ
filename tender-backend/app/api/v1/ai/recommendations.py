"""AI smart tender recommendations based on user interests and company profile.

Recommendation distribution:
- User with no secondary interests:
    75% primary category, 25% other categories
- User with secondary interests:
    75% primary category, 15% secondary interest categories, 10% other
"""

import logging
from collections import Counter
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.auth.user import User
from app.models.auth.user_interest import UserInterest
from app.models.companies.company import Company
from app.models.tenders.tender import Tender
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class RecommendedTender(BaseModel):
    id: int
    title: str
    category: Optional[str] = None
    region: Optional[str] = None
    amount: Optional[float] = None
    currency: str = "UZS"
    deadline: Optional[str] = None
    source: str
    recommendation_reason: str
    relevance_score: float


class RecommendationResponse(BaseModel):
    total: int
    primary_category: Optional[str] = None
    distribution: dict
    tenders: List[RecommendedTender]


@router.get("", response_model=SuccessResponse[RecommendationResponse])
async def get_recommendations(
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_result = await db.execute(
        select(Company).where(Company.user_id == user.id)
    )
    company = company_result.scalar_one_or_none()

    interests_result = await db.execute(
        select(UserInterest)
        .where(UserInterest.user_id == user.id)
        .order_by(UserInterest.created_at.desc())
    )
    interests = interests_result.scalars().all()

    primary_categories = []
    if company and company.categories:
        if isinstance(company.categories, list):
            primary_categories = company.categories
        elif isinstance(company.categories, str):
            primary_categories = [company.categories]

    interest_categories = Counter()
    for i in interests:
        if i.category and i.category not in primary_categories:
            weight = {"tender_apply": 3, "tender_save": 2, "document_download": 2, "tender_view": 1}
            interest_categories[i.category] += weight.get(i.action, 1)

    secondary_categories = [cat for cat, _ in interest_categories.most_common(3)]
    has_secondary = len(secondary_categories) > 0

    if has_secondary:
        primary_count = int(limit * 0.75)
        secondary_count = int(limit * 0.15)
        other_count = limit - primary_count - secondary_count
    else:
        primary_count = int(limit * 0.75)
        secondary_count = 0
        other_count = limit - primary_count

    tenders = []
    used_ids = set()

    if primary_categories:
        result = await db.execute(
            select(Tender)
            .where(
                Tender.status == "active",
                Tender.category.in_(primary_categories),
                Tender.is_deleted == False,
            )
            .order_by(Tender.published_at.desc().nullslast())
            .limit(primary_count)
        )
        for t in result.scalars().all():
            used_ids.add(t.id)
            tenders.append(_to_recommendation(t, "Asosiy sohangizga oid", 0.95))

    if secondary_categories:
        result = await db.execute(
            select(Tender)
            .where(
                Tender.status == "active",
                Tender.category.in_(secondary_categories),
                Tender.is_deleted == False,
                Tender.id.notin_(used_ids) if used_ids else True,
            )
            .order_by(Tender.published_at.desc().nullslast())
            .limit(secondary_count)
        )
        for t in result.scalars().all():
            used_ids.add(t.id)
            tenders.append(_to_recommendation(t, "Qiziqishingizga asoslangan", 0.70))

    if other_count > 0:
        exclude_cats = set(primary_categories + secondary_categories)
        conditions = [
            Tender.status == "active",
            Tender.is_deleted == False,
        ]
        if used_ids:
            conditions.append(Tender.id.notin_(used_ids))
        if exclude_cats:
            conditions.append(Tender.category.notin_(exclude_cats))

        result = await db.execute(
            select(Tender)
            .where(*conditions)
            .order_by(Tender.published_at.desc().nullslast())
            .limit(other_count)
        )
        for t in result.scalars().all():
            tenders.append(_to_recommendation(t, "Yangi imkoniyat", 0.40))

    distribution = {
        "primary": f"{int(primary_count/limit*100)}%",
        "secondary": f"{int(secondary_count/limit*100)}%" if has_secondary else "0%",
        "other": f"{int(other_count/limit*100)}%",
    }

    return SuccessResponse(data=RecommendationResponse(
        total=len(tenders),
        primary_category=primary_categories[0] if primary_categories else None,
        distribution=distribution,
        tenders=tenders,
    ))


def _to_recommendation(tender: Tender, reason: str, score: float) -> RecommendedTender:
    return RecommendedTender(
        id=tender.id,
        title=tender.title,
        category=tender.category,
        region=tender.region,
        amount=tender.amount,
        currency=tender.currency,
        deadline=str(tender.deadline) if tender.deadline else None,
        source=tender.source,
        recommendation_reason=reason,
        relevance_score=score,
    )
