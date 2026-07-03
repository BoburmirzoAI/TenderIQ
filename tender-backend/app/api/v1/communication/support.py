"""Support ticket system — create, view, reply to tickets."""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.auth.user import User
from app.models.communication.support_ticket import SupportTicket, TicketMessage
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()

VALID_CATEGORIES = {"general", "technical", "billing", "tender", "account", "bug", "feature"}
VALID_PRIORITIES = {"low", "medium", "high", "urgent"}
VALID_STATUSES = {"open", "in_progress", "waiting", "resolved", "closed"}


class TicketCreate(BaseModel):
    subject: str = Field(..., min_length=3, max_length=500)
    description: str = Field(..., min_length=10, max_length=5000)
    category: str = "general"
    priority: str = "medium"


class MessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)


class MessageRead(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    message: str
    is_staff: bool
    created_at: str


class TicketRead(BaseModel):
    id: int
    subject: str
    description: str
    category: str
    priority: str
    status: str
    user_id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    assigned_to: Optional[int] = None
    assignee_name: Optional[str] = None
    messages: List[MessageRead] = []
    created_at: str
    updated_at: str


class TicketStats(BaseModel):
    total: int
    by_status: dict
    by_category: dict
    by_priority: dict


@router.post("", response_model=SuccessResponse[TicketRead])
async def create_ticket(
    data: TicketCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"category: {', '.join(VALID_CATEGORIES)}")
    if data.priority not in VALID_PRIORITIES:
        raise HTTPException(status_code=400, detail=f"priority: {', '.join(VALID_PRIORITIES)}")

    ticket = SupportTicket(
        user_id=user.id,
        subject=data.subject,
        description=data.description,
        category=data.category,
        priority=data.priority,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return SuccessResponse(data=_to_read(ticket))


@router.get("", response_model=SuccessResponse[List[TicketRead]])
async def list_my_tickets(
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(SupportTicket).where(SupportTicket.user_id == user.id)
    if status:
        query = query.where(SupportTicket.status == status)

    result = await db.execute(query.order_by(SupportTicket.created_at.desc()).offset((page - 1) * size).limit(size))
    tickets = result.scalars().all()
    return SuccessResponse(data=[_to_read(t) for t in tickets])


@router.get("/{ticket_id}", response_model=SuccessResponse[TicketRead])
async def get_ticket(
    ticket_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket topilmadi")
    if ticket.user_id != user.id and not user.is_admin:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")
    return SuccessResponse(data=_to_read(ticket))


@router.post("/{ticket_id}/messages", response_model=SuccessResponse[MessageRead])
async def reply_to_ticket(
    ticket_id: int,
    data: MessageCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket topilmadi")
    if ticket.user_id != user.id and not user.is_admin:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    msg = TicketMessage(
        ticket_id=ticket_id,
        user_id=user.id,
        message=data.message,
        is_staff=1 if user.is_admin else 0,
    )
    db.add(msg)

    if ticket.status == "resolved" and not user.is_admin:
        ticket.status = "open"
    elif user.is_admin and ticket.status == "open":
        ticket.status = "in_progress"

    await db.commit()
    await db.refresh(msg)

    return SuccessResponse(data=MessageRead(
        id=msg.id,
        user_id=msg.user_id,
        user_name=msg.user.full_name if msg.user else None,
        message=msg.message,
        is_staff=bool(msg.is_staff),
        created_at=str(msg.created_at),
    ))


@router.patch("/{ticket_id}/close", response_model=SuccessResponse[TicketRead])
async def close_ticket(
    ticket_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket topilmadi")
    if ticket.user_id != user.id and not user.is_admin:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    ticket.status = "closed"
    await db.commit()
    await db.refresh(ticket)
    return SuccessResponse(data=_to_read(ticket))


def _to_read(t: SupportTicket) -> TicketRead:
    return TicketRead(
        id=t.id,
        subject=t.subject,
        description=t.description,
        category=t.category,
        priority=t.priority,
        status=t.status,
        user_id=t.user_id,
        user_name=t.user.full_name if t.user else None,
        user_email=t.user.email if t.user else None,
        assigned_to=t.assigned_to,
        assignee_name=t.assignee.full_name if t.assignee else None,
        messages=[
            MessageRead(
                id=m.id,
                user_id=m.user_id,
                user_name=m.user.full_name if m.user else None,
                message=m.message,
                is_staff=bool(m.is_staff),
                created_at=str(m.created_at),
            )
            for m in (t.messages or [])
        ],
        created_at=str(t.created_at),
        updated_at=str(t.updated_at),
    )
