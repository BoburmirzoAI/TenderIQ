"""FastAPI dependency injection for auth, database, and plan checks."""

import logging
from typing import Optional

from fastapi import Depends, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import PLAN_LIMITS, SubscriptionPlan
from app.database import get_db
from app.exceptions import ForbiddenException, PlanLimitException, UnauthorizedException
from app.models.auth.user import User
from app.repositories.finance.subscription_repo import SubscriptionRepository
from app.repositories.auth.user_repo import UserRepository
from app.utils.security import decode_token, hash_api_key

logger = logging.getLogger(__name__)


async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the current user from JWT or API key."""
    user_repo = UserRepository(db)

    if x_api_key:
        user = await user_repo.get_by_api_key(hash_api_key(x_api_key))
        if not user or not user.is_active:
            raise UnauthorizedException("Invalid API key")
        return user

    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedException("Missing authorization header")

    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise UnauthorizedException("Access token required")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token payload")

    user = await user_repo.get_by_id(int(user_id))
    if not user or not user.is_active:
        raise UnauthorizedException("User not found or inactive")

    # Reject tokens issued before password change or logout-all
    token_ver = payload.get("ver")
    if token_ver is not None and token_ver != user.token_version:
        raise UnauthorizedException("Token invalidated — please log in again")

    return user


async def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Optionally extract user, returning None for anonymous requests."""
    if not authorization or not authorization.startswith("Bearer "):
        return None

    from app.exceptions import UnauthorizedException

    try:
        token = authorization.split(" ", 1)[1]
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id:
            user_repo = UserRepository(db)
            return await user_repo.get_by_id(int(user_id))
    except UnauthorizedException:
        # Expired or invalid token — anonymous access is allowed here
        return None
    return None


async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Require admin privileges."""
    if not user.is_admin and not user.is_superadmin:
        raise ForbiddenException("Admin access required")
    return user


async def require_superadmin(user: User = Depends(get_current_user)) -> User:
    """Require superadmin privileges."""
    if not user.is_superadmin:
        raise ForbiddenException("Superadmin access required")
    return user


def require_permission(permission_name: str):
    """Factory — require a specific permission (or admin/superadmin)."""

    async def _check(user: User = Depends(get_current_user)) -> User:
        if user.is_admin or user.is_superadmin:
            return user

        user_perms = set()
        if user.roles:
            for role in user.roles:
                if role.permissions:
                    for perm in role.permissions:
                        user_perms.add(perm.name)

        if permission_name not in user_perms:
            raise ForbiddenException(f"'{permission_name}' ruxsati talab qilinadi")
        return user

    return _check


def require_plan(feature: str):
    """Factory for plan-based feature gating."""

    async def _check_plan(
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        if user.is_admin or user.is_superadmin:
            return user

        sub_repo = SubscriptionRepository(db)
        sub = await sub_repo.get_active_for_user(user.id)

        if not sub:
            raise PlanLimitException(feature)

        plan = SubscriptionPlan(sub.plan)
        limits = PLAN_LIMITS[plan]

        if not limits.get(feature, False):
            raise PlanLimitException(feature)

        return user

    return _check_plan
