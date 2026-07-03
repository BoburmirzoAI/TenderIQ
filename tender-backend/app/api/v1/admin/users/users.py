"""Admin user management — list, detail, update, delete, message."""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.exceptions import NotFoundException
from app.utils import escape_like as _esc
from app.models.system.audit_log import AuditLog
from app.models.communication.notification import Notification
from app.models.finance.subscription import Subscription
from app.models.auth.user import User
from app.repositories.auth.user_repo import UserRepository
from app.schemas.admin import (
    AdminUserDetail,
    AdminUserRoleUpdate,
    BroadcastRequest,
)
from app.schemas.base import PaginatedResponse, SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


from pydantic import BaseModel as PydanticBaseModel


class AdminCreateUser(PydanticBaseModel):
    email: str
    full_name: str
    password: str
    phone: str | None = None
    is_admin: bool = False
    is_active: bool = True
    is_verified: bool = True


@router.post("", response_model=SuccessResponse[AdminUserDetail])
async def create_user(
    data: AdminCreateUser,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin creates a new user account."""
    from app.utils.security import hash_password

    existing = (await db.execute(select(User).where(User.email == data.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Bu email allaqachon ro'yxatdan o'tgan")

    if data.phone:
        phone_exists = (await db.execute(select(User).where(User.phone == data.phone))).scalar_one_or_none()
        if phone_exists:
            raise HTTPException(status_code=400, detail="Bu telefon raqam allaqachon mavjud")

    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        phone=data.phone,
        is_admin=data.is_admin,
        is_active=data.is_active,
        is_verified=data.is_verified,
    )
    db.add(user)
    await db.flush()

    db.add(AuditLog(
        user_id=admin.id,
        action="user_created",
        resource_type="user",
        resource_id=user.id,
        details=json.dumps({"email": data.email, "full_name": data.full_name}),
    ))
    await db.commit()
    await db.refresh(user)

    logger.info("Admin %d created user %d (%s)", admin.id, user.id, data.email)
    return SuccessResponse(data=AdminUserDetail.model_validate(user), message="Foydalanuvchi yaratildi")


@router.get("", response_model=PaginatedResponse[AdminUserDetail])
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query("", description="Email yoki ism bo'yicha qidiruv"),
    plan: str = Query("", description="free | pro | business"),
    is_active: str = Query("", description="true | false"),
    is_admin: str = Query("", description="true | false"),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users with filters and pagination."""
    stmt = select(User)

    if search:
        stmt = stmt.where(
            or_(
                User.email.ilike(f"%{_esc(search)}%", escape="\\"),
                User.full_name.ilike(f"%{_esc(search)}%", escape="\\"),
            )
        )
    if is_active in ("true", "false"):
        stmt = stmt.where(User.is_active.is_(is_active == "true"))
    if is_admin in ("true", "false"):
        stmt = stmt.where(User.is_admin.is_(is_admin == "true"))

    # Plan filtri — subscription orqali
    if plan:
        stmt = stmt.join(
            Subscription,
            (Subscription.user_id == User.id) & Subscription.is_active.is_(True),
            isouter=True,
        ).where(Subscription.plan == plan)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one() or 0
    total_pages = (total + per_page - 1) // per_page

    stmt = stmt.order_by(User.id.desc()).offset((page - 1) * per_page).limit(per_page)
    users = list((await db.execute(stmt)).scalars().all())

    items = [AdminUserDetail.model_validate(u) for u in users]
    return PaginatedResponse(
        data=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


@router.get("/{user_id}", response_model=SuccessResponse[AdminUserDetail])
async def get_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get full user detail."""
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise NotFoundException("User", str(user_id))
    return SuccessResponse(data=AdminUserDetail.model_validate(user))


@router.patch("/{user_id}/role", response_model=SuccessResponse[AdminUserDetail])
async def update_user_role(
    user_id: int,
    data: AdminUserRoleUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update user role (admin/verified/active flags)."""
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise NotFoundException("User", str(user_id))

    if user.is_superadmin and not admin.is_superadmin:
        raise HTTPException(status_code=403, detail="Superadminni faqat superadmin o'zgartira oladi")
    if user_id == admin.id:
        raise HTTPException(status_code=403, detail="O'z huquqingizni o'zgartira olmaysiz")

    update_data = data.model_dump(exclude_unset=True)
    if "is_admin" in update_data and not admin.is_superadmin:
        raise HTTPException(status_code=403, detail="Admin huquqini faqat superadmin berishi mumkin")

    updated = await user_repo.update(user_id, update_data)

    db.add(AuditLog(
        user_id=admin.id,
        action="user_role_updated",
        resource_type="user",
        resource_id=user_id,
        details=json.dumps(update_data),
    ))
    await db.commit()
    logger.info("Admin %d updated user %d role: %s", admin.id, user_id, update_data)
    return SuccessResponse(data=AdminUserDetail.model_validate(updated))


@router.patch("/{user_id}", response_model=SuccessResponse[AdminUserDetail])
async def update_user(
    user_id: int,
    data: dict,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update user profile fields (full_name, email, is_active, etc.)."""
    from fastapi import Body
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise NotFoundException("User", str(user_id))

    allowed_fields = {"full_name", "email", "is_active", "phone"}
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    updated = await user_repo.update(user_id, update_data)

    db.add(AuditLog(
        user_id=admin.id,
        action="user_updated",
        resource_type="user",
        resource_id=user_id,
        details=json.dumps(update_data),
    ))
    await db.commit()
    return SuccessResponse(data=AdminUserDetail.model_validate(updated))


@router.patch("/{user_id}/toggle-active", response_model=SuccessResponse[dict])
async def toggle_user_active(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Toggle user active/inactive status."""
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise NotFoundException("User", str(user_id))
    if user_id == admin.id:
        raise HTTPException(status_code=403, detail="O'zingizni bloklay olmaysiz")

    new_status = not user.is_active
    await user_repo.update(user_id, {"is_active": new_status})

    db.add(AuditLog(
        user_id=admin.id,
        action="user_blocked" if not new_status else "user_unblocked",
        resource_type="user",
        resource_id=user_id,
        details=json.dumps({"is_active": new_status}),
    ))
    await db.commit()
    return SuccessResponse(
        data={"is_active": new_status},
        message="Foydalanuvchi faollashtirildi" if new_status else "Foydalanuvchi bloklandi",
    )


@router.delete("/{user_id}", response_model=SuccessResponse[dict])
async def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete a user account."""
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise NotFoundException("User", str(user_id))
    if user_id == admin.id:
        raise HTTPException(status_code=403, detail="O'z hisobingizni o'chira olmaysiz")
    if user.is_superadmin:
        raise HTTPException(status_code=403, detail="Superadmin hisobini o'chirish mumkin emas")

    await user_repo.soft_delete(user_id)

    db.add(AuditLog(
        user_id=admin.id,
        action="user_deleted",
        resource_type="user",
        resource_id=user_id,
    ))
    await db.commit()
    logger.info("Admin %d deleted user %d", admin.id, user_id)
    return SuccessResponse(data={"deleted": True}, message="Foydalanuvchi o'chirildi")


@router.post("/{user_id}/message", response_model=SuccessResponse[dict])
async def send_message_to_user(
    user_id: int,
    data: BroadcastRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Send a direct message to a specific user via email/telegram/in-app."""
    from app.services.communication.notification_service import NotificationService

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise NotFoundException("User", str(user_id))

    sent_channels = []
    notif_svc = NotificationService(db)

    if "in_app" in data.channels or not data.channels:
        notif = Notification(
            user_id=user_id,
            type="admin_message",
            channel="in_app",
            title=data.title,
            message=data.message,
            is_sent=True,
        )
        db.add(notif)
        sent_channels.append("in_app")

    if "email" in data.channels and user.notify_email and user.email:
        ok = await notif_svc.send_email(user.email, data.title, data.message)
        if ok:
            sent_channels.append("email")

    if "telegram" in data.channels and user.telegram_id:
        ok = await notif_svc.send_telegram(user.telegram_id, f"*{data.title}*\n\n{data.message}")
        if ok:
            sent_channels.append("telegram")

    db.add(AuditLog(
        user_id=admin.id,
        action="message_sent",
        resource_type="user",
        resource_id=user_id,
        details=json.dumps({"channels": sent_channels, "title": data.title}),
    ))
    await db.commit()
    return SuccessResponse(
        data={"sent_channels": sent_channels},
        message=f"Xabar {len(sent_channels)} ta kanal orqali yuborildi",
    )
