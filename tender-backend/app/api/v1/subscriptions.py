"""Subscription management endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.base import SuccessResponse
from app.schemas.subscription import PlanInfo, SubscriptionRead, UsageStats
from app.services.subscription_service import SubscriptionService

router = APIRouter()


@router.get("/current", response_model=SuccessResponse[SubscriptionRead])
async def get_current_subscription(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's active subscription."""
    service = SubscriptionService(db)
    sub = await service.get_current(user.id)
    return SuccessResponse(data=sub)


@router.get("/plans", response_model=SuccessResponse[list[PlanInfo]])
async def list_plans(db: AsyncSession = Depends(get_db)):
    """List all available subscription plans."""
    service = SubscriptionService(db)
    plans = service.get_all_plans()
    return SuccessResponse(data=plans)


@router.get("/usage", response_model=SuccessResponse[UsageStats])
async def get_usage(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current usage statistics."""
    service = SubscriptionService(db)
    stats = await service.get_usage_stats(user.id)
    return SuccessResponse(data=stats)
