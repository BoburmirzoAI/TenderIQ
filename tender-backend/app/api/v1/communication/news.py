"""News and announcements — public read."""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.communication.news import News
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class NewsRead(BaseModel):
    id: int
    title: str
    slug: str
    content: str
    summary: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    author_name: Optional[str] = None
    is_pinned: bool
    view_count: int
    created_at: str


class NewsListItem(BaseModel):
    id: int
    title: str
    slug: str
    summary: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_pinned: bool
    view_count: int
    created_at: str


@router.get("", response_model=SuccessResponse[List[NewsListItem]])
async def list_news(
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(News).where(News.is_published == True)
    if category:
        query = query.where(News.category == category)

    result = await db.execute(
        query.order_by(News.is_pinned.desc(), News.created_at.desc())
        .offset((page - 1) * size).limit(size)
    )
    news_list = result.scalars().all()

    return SuccessResponse(data=[
        NewsListItem(
            id=n.id, title=n.title, slug=n.slug, summary=n.summary,
            category=n.category, image_url=n.image_url, is_pinned=n.is_pinned,
            view_count=n.view_count, created_at=str(n.created_at),
        )
        for n in news_list
    ])


@router.get("/{slug}", response_model=SuccessResponse[NewsRead])
async def get_news(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(News).where(News.slug == slug, News.is_published == True)
    )
    news = result.scalar_one_or_none()
    if not news:
        raise HTTPException(status_code=404, detail="Yangilik topilmadi")

    news.view_count += 1
    await db.commit()

    return SuccessResponse(data=NewsRead(
        id=news.id, title=news.title, slug=news.slug,
        content=news.content, summary=news.summary,
        category=news.category, image_url=news.image_url,
        author_name=news.author.full_name if news.author else None,
        is_pinned=news.is_pinned, view_count=news.view_count,
        created_at=str(news.created_at),
    ))
