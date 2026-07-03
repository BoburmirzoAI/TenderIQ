"""Knowledge base — articles, guides, tutorials (public read, admin write)."""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.utils import escape_like as _esc
from app.models.auth.user import User
from app.models.communication.knowledge_base import KBArticle, KBCategory
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class CategoryRead(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    article_count: int = 0


class ArticleRead(BaseModel):
    id: int
    title: str
    slug: str
    content: str
    summary: Optional[str] = None
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
    author_name: Optional[str] = None
    view_count: int
    tags: Optional[str] = None
    created_at: str
    updated_at: str


class ArticleListItem(BaseModel):
    id: int
    title: str
    slug: str
    summary: Optional[str] = None
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
    view_count: int
    created_at: str


@router.get("/categories", response_model=SuccessResponse[List[CategoryRead]])
async def list_categories(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(KBCategory).order_by(KBCategory.order, KBCategory.name))
    categories = result.scalars().all()

    data = []
    for cat in categories:
        count = (await db.execute(
            select(func.count(KBArticle.id))
            .where(KBArticle.category_id == cat.id, KBArticle.is_published == True)
        )).scalar_one()
        data.append(CategoryRead(
            id=cat.id, name=cat.name, slug=cat.slug,
            description=cat.description, icon=cat.icon, article_count=count,
        ))
    return SuccessResponse(data=data)


@router.get("/articles", response_model=SuccessResponse[List[ArticleListItem]])
async def list_articles(
    category: Optional[str] = None,
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(KBArticle).where(KBArticle.is_published == True)

    if category:
        query = query.join(KBCategory).where(KBCategory.slug == category)
    if q:
        query = query.where(KBArticle.title.ilike(f"%{_esc(q)}%", escape="\\") | KBArticle.content.ilike(f"%{_esc(q)}%", escape="\\"))

    result = await db.execute(
        query.order_by(KBArticle.order, KBArticle.created_at.desc())
        .offset((page - 1) * size).limit(size)
    )
    articles = result.scalars().all()

    return SuccessResponse(data=[
        ArticleListItem(
            id=a.id, title=a.title, slug=a.slug, summary=a.summary,
            category_name=a.category.name if a.category else None,
            category_slug=a.category.slug if a.category else None,
            view_count=a.view_count, created_at=str(a.created_at),
        )
        for a in articles
    ])


@router.get("/articles/{slug}", response_model=SuccessResponse[ArticleRead])
async def get_article(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KBArticle).where(KBArticle.slug == slug, KBArticle.is_published == True)
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Maqola topilmadi")

    article.view_count += 1
    await db.commit()

    return SuccessResponse(data=ArticleRead(
        id=article.id, title=article.title, slug=article.slug,
        content=article.content, summary=article.summary,
        category_name=article.category.name if article.category else None,
        category_slug=article.category.slug if article.category else None,
        author_name=article.author.full_name if article.author else None,
        view_count=article.view_count, tags=article.tags,
        created_at=str(article.created_at), updated_at=str(article.updated_at),
    ))
