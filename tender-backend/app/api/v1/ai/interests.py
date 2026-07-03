"""User interest tracking — FIFO 10 system.

Records meaningful user actions and maintains only the last 10 per user.
Used by AI smart recommendation system to personalize tender suggestions.
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.auth.user import User
from app.models.auth.user_interest import UserInterest
from app.models.tenders.tender import Tender
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()

VALID_ACTIONS = {"tender_view", "tender_save", "tender_apply", "document_download"}
MAX_INTERESTS = 10


class InterestCreate(BaseModel):
    tender_id: int
    action: str
    duration_seconds: Optional[float] = None

    @field_validator("action")
    @classmethod
    def validate_action(cls, v):
        if v not in VALID_ACTIONS:
            raise ValueError(f"action must be one of: {', '.join(VALID_ACTIONS)}")
        return v

    @field_validator("duration_seconds")
    @classmethod
    def validate_duration(cls, v, info):
        if info.data.get("action") == "tender_view" and (v is None or v < 10):
            raise ValueError("tender_view requires duration_seconds >= 10")
        return v


class InterestRead(BaseModel):
    id: int
    tender_id: int
    action: str
    category: Optional[str] = None
    region: Optional[str] = None
    duration_seconds: Optional[float] = None
    created_at: str


class InterestStats(BaseModel):
    total_actions: int
    categories: dict
    regions: dict
    primary_category: Optional[str] = None
    primary_region: Optional[str] = None


@router.post("", response_model=SuccessResponse[InterestRead])
async def record_interest(
    data: InterestCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tender).where(Tender.id == data.tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender topilmadi")

    interest = UserInterest(
        user_id=user.id,
        tender_id=data.tender_id,
        action=data.action,
        category=tender.category,
        region=tender.region,
        duration_seconds=data.duration_seconds,
    )
    db.add(interest)
    await db.flush()

    count = (await db.execute(
        select(func.count(UserInterest.id)).where(UserInterest.user_id == user.id)
    )).scalar_one()

    if count > MAX_INTERESTS:
        oldest = (await db.execute(
            select(UserInterest.id)
            .where(UserInterest.user_id == user.id)
            .order_by(UserInterest.created_at.asc())
            .limit(count - MAX_INTERESTS)
        )).scalars().all()

        if oldest:
            await db.execute(
                delete(UserInterest).where(UserInterest.id.in_(oldest))
            )

    await db.commit()
    await db.refresh(interest)

    return SuccessResponse(data=InterestRead(
        id=interest.id,
        tender_id=interest.tender_id,
        action=interest.action,
        category=interest.category,
        region=interest.region,
        duration_seconds=interest.duration_seconds,
        created_at=str(interest.created_at),
    ))


@router.get("", response_model=SuccessResponse[List[InterestRead]])
async def get_my_interests(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserInterest)
        .where(UserInterest.user_id == user.id)
        .order_by(UserInterest.created_at.desc())
    )
    interests = result.scalars().all()
    return SuccessResponse(data=[
        InterestRead(
            id=i.id,
            tender_id=i.tender_id,
            action=i.action,
            category=i.category,
            region=i.region,
            duration_seconds=i.duration_seconds,
            created_at=str(i.created_at),
        )
        for i in interests
    ])


@router.get("/stats", response_model=SuccessResponse[InterestStats])
async def get_interest_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserInterest)
        .where(UserInterest.user_id == user.id)
        .order_by(UserInterest.created_at.desc())
    )
    interests = result.scalars().all()

    categories = {}
    regions = {}
    for i in interests:
        if i.category:
            categories[i.category] = categories.get(i.category, 0) + 1
        if i.region:
            regions[i.region] = regions.get(i.region, 0) + 1

    primary_category = max(categories, key=categories.get) if categories else None
    primary_region = max(regions, key=regions.get) if regions else None

    return SuccessResponse(data=InterestStats(
        total_actions=len(interests),
        categories=categories,
        regions=regions,
        primary_category=primary_category,
        primary_region=primary_region,
    ))
