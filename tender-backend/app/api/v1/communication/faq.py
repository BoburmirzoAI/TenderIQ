"""FAQ — frequently asked questions (public read)."""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.communication.faq import FAQ
from app.utils import escape_like as _esc
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class FAQRead(BaseModel):
    id: int
    question: str
    answer: str
    category: Optional[str] = None


@router.get("", response_model=SuccessResponse[List[FAQRead]])
async def list_faqs(
    category: Optional[str] = None,
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(FAQ).where(FAQ.is_published == True)
    if category:
        query = query.where(FAQ.category == category)
    if q:
        query = query.where(FAQ.question.ilike(f"%{_esc(q)}%", escape="\\") | FAQ.answer.ilike(f"%{_esc(q)}%", escape="\\"))

    result = await db.execute(query.order_by(FAQ.order, FAQ.id))
    faqs = result.scalars().all()

    return SuccessResponse(data=[
        FAQRead(id=f.id, question=f.question, answer=f.answer, category=f.category)
        for f in faqs
    ])


@router.get("/categories")
async def faq_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FAQ.category).where(FAQ.is_published == True, FAQ.category.isnot(None))
        .distinct().order_by(FAQ.category)
    )
    return SuccessResponse(data=[r[0] for r in result.all()])
