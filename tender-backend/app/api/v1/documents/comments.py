"""Document comments — questions and discussions on tender documents."""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.auth.user import User
from app.models.documents.document_comment import DocumentComment
from app.models.tenders.tender import Tender
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=3000)
    parent_id: Optional[int] = None


class CommentRead(BaseModel):
    id: int
    tender_id: int
    user_id: int
    user_name: Optional[str] = None
    parent_id: Optional[int] = None
    content: str
    replies: List["CommentRead"] = []
    created_at: str


@router.get("/tender/{tender_id}", response_model=SuccessResponse[List[CommentRead]])
async def get_comments(
    tender_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DocumentComment)
        .where(DocumentComment.tender_id == tender_id, DocumentComment.parent_id.is_(None))
        .order_by(DocumentComment.created_at.desc())
    )
    comments = result.scalars().all()
    return SuccessResponse(data=[_to_read(c) for c in comments])


@router.post("/tender/{tender_id}", response_model=SuccessResponse[CommentRead])
async def add_comment(
    tender_id: int,
    data: CommentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tender = (await db.execute(select(Tender).where(Tender.id == tender_id))).scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender topilmadi")

    if data.parent_id:
        parent = (await db.execute(
            select(DocumentComment).where(DocumentComment.id == data.parent_id)
        )).scalar_one_or_none()
        if not parent or parent.tender_id != tender_id:
            raise HTTPException(status_code=404, detail="Izoh topilmadi")

    comment = DocumentComment(
        tender_id=tender_id,
        user_id=user.id,
        parent_id=data.parent_id,
        content=data.content,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return SuccessResponse(data=_to_read(comment))


@router.delete("/{comment_id}", response_model=SuccessResponse[dict])
async def delete_comment(
    comment_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DocumentComment).where(DocumentComment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Izoh topilmadi")
    if comment.user_id != user.id and not user.is_admin:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    await db.delete(comment)
    await db.commit()
    return SuccessResponse(data={"deleted": True})


@router.get("/tender/{tender_id}/count")
async def comment_count(
    tender_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count = (await db.execute(
        select(func.count(DocumentComment.id)).where(DocumentComment.tender_id == tender_id)
    )).scalar_one()
    return SuccessResponse(data={"count": count})


def _to_read(c: DocumentComment) -> CommentRead:
    return CommentRead(
        id=c.id,
        tender_id=c.tender_id,
        user_id=c.user_id,
        user_name=c.user.full_name if c.user else None,
        parent_id=c.parent_id,
        content=c.content,
        replies=[_to_read(r) for r in (c.replies or [])],
        created_at=str(c.created_at),
    )
