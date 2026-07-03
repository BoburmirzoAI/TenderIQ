"""Admin notifications — broadcast, create, and notification list."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel as PydanticBaseModel
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.communication.notification import Notification
from app.models.finance.subscription import Subscription
from app.models.auth.user import User
from app.schemas.admin import AdminNotificationRead, BroadcastRequest, NotificationStats
from app.schemas.base import PaginatedResponse, SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class AdminNotificationCreate(PydanticBaseModel):
    user_id: int
    title: str
    message: str
    type: str = "admin_message"
    channel: str = "in_app"


@router.post("", response_model=SuccessResponse[dict])
async def create_notification(
    data: AdminNotificationCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Send a notification to a specific user."""
    user = (await db.execute(select(User).where(User.id == data.user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    notif = Notification(
        user_id=data.user_id,
        type=data.type,
        channel=data.channel,
        title=data.title,
        message=data.message,
        is_sent=True,
    )
    db.add(notif)
    await db.commit()
    return SuccessResponse(data={"sent": True, "user_id": data.user_id})


@router.post("/broadcast", response_model=SuccessResponse[dict])
async def broadcast_notification(
    data: BroadcastRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Send broadcast notification to all or filtered users."""
    from app.services.communication.notification_service import NotificationService

    notif_svc = NotificationService(db)

    # Maqsadli foydalanuvchilarni tanlash
    # plan_filter target dan ustun turadi
    plan_target = data.plan_filter or (data.target if data.target in ("pro", "business", "paid") else None)

    stmt = select(User).where(User.is_active.is_(True))
    if plan_target == "paid":
        stmt = stmt.join(
            Subscription,
            (Subscription.user_id == User.id) & Subscription.is_active.is_(True),
        ).where(Subscription.plan.in_(["pro", "business"]))
    elif plan_target in ("pro", "business"):
        stmt = stmt.join(
            Subscription,
            (Subscription.user_id == User.id) & Subscription.is_active.is_(True),
        ).where(Subscription.plan == plan_target)

    users = list((await db.execute(stmt)).scalars().all())

    sent_count = 0
    for user in users:
        # In-app notification
        notif = Notification(
            user_id=user.id,
            type="broadcast",
            channel="in_app",
            title=data.title,
            message=data.message,
            is_sent=True,
        )
        db.add(notif)

        if "email" in data.channels and user.notify_email and user.email:
            await notif_svc.send_email(user.email, data.title, data.message)

        if "telegram" in data.channels and user.telegram_id:
            await notif_svc.send_telegram(
                user.telegram_id, f"*{data.title}*\n\n{data.message}"
            )
        sent_count += 1

    await db.commit()
    logger.info("Broadcast sent by admin %d to %d users", admin.id, sent_count)
    return SuccessResponse(
        data={"sent_to": sent_count},
        message=f"Xabar {sent_count} ta foydalanuvchiga yuborildi",
    )


@router.get("", response_model=PaginatedResponse[AdminNotificationRead])
async def list_notifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    notification_type: str = Query("", alias="type"),
    channel: str = Query(""),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all notifications with filters."""
    stmt = select(Notification)
    if notification_type:
        stmt = stmt.where(Notification.type == notification_type)
    if channel:
        stmt = stmt.where(Notification.channel == channel)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one() or 0
    total_pages = (total + per_page - 1) // per_page

    stmt = stmt.order_by(Notification.id.desc()).offset((page - 1) * per_page).limit(per_page)
    notifs = list((await db.execute(stmt)).scalars().all())

    items = []
    for n in notifs:
        item = AdminNotificationRead.model_validate(n)
        user_res = await db.execute(
            select(User.email).where(User.id == n.user_id)
        )
        user_row = user_res.first()
        if user_row:
            item.user_email = user_row.email
        items.append(item)

    return PaginatedResponse(
        data=items, total=total, page=page, per_page=per_page,
        total_pages=total_pages, has_next=page < total_pages, has_prev=page > 1,
    )


@router.get("/stats", response_model=SuccessResponse[NotificationStats])
async def get_notification_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Notification delivery statistics."""
    total_sent = (await db.execute(
        select(func.count()).select_from(Notification).where(Notification.is_sent.is_(True))
    )).scalar_one() or 0

    total_read = (await db.execute(
        select(func.count()).select_from(Notification).where(Notification.is_read.is_(True))
    )).scalar_one() or 0

    read_rate = round((total_read / total_sent * 100) if total_sent > 0 else 0, 1)

    by_channel_res = await db.execute(
        select(
            Notification.channel,
            func.count().label("total"),
            func.sum(
                case((Notification.is_read.is_(True), 1), else_=0)
            ).label("read_count"),
        ).group_by(Notification.channel)
    )

    by_channel = []
    for row in by_channel_res.all():
        sent = row.total or 0
        read_c = int(row.read_count or 0)
        by_channel.append({
            "channel": row.channel,
            "sent": sent,
            "delivered": read_c,
            "delivery_rate": round((read_c / sent * 100) if sent > 0 else 0, 1),
        })

    # Tip bo'yicha statistika
    type_res = await db.execute(
        select(Notification.type, func.count().label("cnt")).group_by(Notification.type)
    )
    by_type = [{"type": row.type, "count": row.cnt} for row in type_res.all()]

    return SuccessResponse(
        data=NotificationStats(
            total_sent=total_sent,
            total_read=total_read,
            read_rate=read_rate,
            by_channel=by_channel,
            by_type=by_type,
        )
    )
