"""Admin email templates — CRUD for editable email templates."""

import json
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.communication.email_template import EmailTemplate
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class EmailTemplateRead(BaseModel):
    id: int
    slug: str
    name: str
    subject: str
    body: str
    description: Optional[str] = None
    category: str
    variables: List[str] = []
    is_active: bool
    created_at: str
    updated_at: str
    model_config = {"from_attributes": True}


class EmailTemplateUpdate(BaseModel):
    subject: Optional[str] = None
    body: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _to_read(t: EmailTemplate) -> EmailTemplateRead:
    variables: List[str] = []
    if t.variables:
        try:
            variables = json.loads(t.variables)
        except (json.JSONDecodeError, TypeError) as e:
            logger.error("Corrupted variables for template %r — stored: %r — %s", t.slug, t.variables, e)
            variables = []
    return EmailTemplateRead(
        id=t.id,
        slug=t.slug,
        name=t.name,
        subject=t.subject,
        body=t.body,
        description=t.description,
        category=t.category,
        variables=variables,
        is_active=t.is_active,
        created_at=str(t.created_at),
        updated_at=str(t.updated_at),
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=SuccessResponse[List[EmailTemplateRead]])
async def list_templates(
    category: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all email templates, optionally filtered by category."""
    query = select(EmailTemplate).order_by(EmailTemplate.category, EmailTemplate.name)
    if category:
        query = query.where(EmailTemplate.category == category)
    result = await db.execute(query)
    templates = result.scalars().all()
    return SuccessResponse(data=[_to_read(t) for t in templates])


@router.get("/stats", response_model=SuccessResponse[dict])
async def template_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Count templates by category."""
    result = await db.execute(select(EmailTemplate))
    templates = result.scalars().all()
    stats: dict = {"total": len(templates)}
    for t in templates:
        stats[t.category] = stats.get(t.category, 0) + 1
    return SuccessResponse(data=stats)


@router.get("/{slug}", response_model=SuccessResponse[EmailTemplateRead])
async def get_template(
    slug: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get a single template by slug."""
    result = await db.execute(select(EmailTemplate).where(EmailTemplate.slug == slug))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail=f"'{slug}' shablon topilmadi")
    return SuccessResponse(data=_to_read(template))


@router.post("/{slug}/preview", response_model=SuccessResponse[dict])
async def preview_template(
    slug: str,
    data: dict,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Render a template with sample variables."""
    result = await db.execute(select(EmailTemplate).where(EmailTemplate.slug == slug))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail=f"'{slug}' shablon topilmadi")
    rendered_subject = template.subject
    rendered_body = template.body
    for key, value in data.items():
        rendered_subject = rendered_subject.replace(f"{{{{{key}}}}}", str(value))
        rendered_body = rendered_body.replace(f"{{{{{key}}}}}", str(value))
    return SuccessResponse(data={
        "slug": slug,
        "subject": rendered_subject,
        "body": rendered_body,
    })


@router.patch("/{slug}", response_model=SuccessResponse[EmailTemplateRead])
async def update_template(
    slug: str,
    data: EmailTemplateUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update subject, body, or description of a template."""
    result = await db.execute(select(EmailTemplate).where(EmailTemplate.slug == slug))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail=f"'{slug}' shablon topilmadi")

    if data.subject is not None:
        template.subject = data.subject
    if data.body is not None:
        template.body = data.body
    if data.description is not None:
        template.description = data.description
    if data.is_active is not None:
        template.is_active = data.is_active

    await db.commit()
    await db.refresh(template)
    return SuccessResponse(data=_to_read(template), message=f"{template.name} saqlandi")
