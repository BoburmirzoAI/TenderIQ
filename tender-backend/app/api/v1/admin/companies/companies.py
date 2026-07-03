"""Admin company management — list, detail, create, update."""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel as PydanticBaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.exceptions import NotFoundException
from app.utils import escape_like as _esc
from app.models.system.audit_log import AuditLog
from app.models.companies.company import Company
from app.models.auth.user import User
from app.repositories.companies.company_repo import CompanyRepository
from app.schemas.admin import AdminCompanyRead, AdminCompanyUpdate
from app.schemas.base import PaginatedResponse, SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class AdminCompanyCreate(PydanticBaseModel):
    user_id: int
    name: str
    stir: str | None = None
    description: str | None = None
    contact_person: str | None = None
    contact_phone: str | None = None
    address: str | None = None
    website: str | None = None


@router.post("", response_model=SuccessResponse[AdminCompanyRead])
async def create_company(
    data: AdminCompanyCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin creates a new company."""
    existing = (await db.execute(select(Company).where(Company.user_id == data.user_id))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Bu foydalanuvchining kompaniyasi allaqachon mavjud")

    if data.stir:
        stir_exists = (await db.execute(select(Company).where(Company.stir == data.stir))).scalar_one_or_none()
        if stir_exists:
            raise HTTPException(status_code=400, detail="Bu STIR allaqachon ro'yxatdan o'tgan")

    company = Company(
        user_id=data.user_id,
        name=data.name,
        stir=data.stir,
        description=data.description,
        contact_person=data.contact_person,
        contact_phone=data.contact_phone,
        address=data.address,
        website=data.website,
    )
    db.add(company)
    await db.flush()

    db.add(AuditLog(
        user_id=admin.id,
        action="company_created",
        resource_type="company",
        resource_id=company.id,
        details=json.dumps({"name": data.name, "user_id": data.user_id}),
    ))
    await db.commit()
    await db.refresh(company)
    return SuccessResponse(data=AdminCompanyRead.model_validate(company))


@router.get("", response_model=PaginatedResponse[AdminCompanyRead])
async def list_companies(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all companies with pagination and search."""
    stmt = select(Company).where(Company.is_deleted.is_(False))

    if search:
        stmt = stmt.where(
            or_(
                Company.name.ilike(f"%{_esc(search)}%", escape="\\"),
                Company.stir.ilike(f"%{_esc(search)}%", escape="\\"),
            )
        )

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one() or 0
    total_pages = (total + per_page - 1) // per_page

    stmt = stmt.order_by(Company.id.desc()).offset((page - 1) * per_page).limit(per_page)
    companies = list((await db.execute(stmt)).scalars().all())

    # Owner ma'lumotlarini qo'shish
    items = []
    for c in companies:
        item = AdminCompanyRead.model_validate(c)
        if c.user_id:
            owner_res = await db.execute(
                select(User.email, User.full_name).where(User.id == c.user_id)
            )
            owner = owner_res.first()
            if owner:
                item.owner_email = owner.email
                item.owner_name = owner.full_name
        items.append(item)

    return PaginatedResponse(
        data=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


@router.get("/{company_id}", response_model=SuccessResponse[AdminCompanyRead])
async def get_company(
    company_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get single company detail."""
    company_repo = CompanyRepository(db)
    company = await company_repo.get_by_id(company_id)
    if not company:
        raise NotFoundException("Company", str(company_id))

    item = AdminCompanyRead.model_validate(company)
    if company.user_id:
        owner_res = await db.execute(
            select(User.email, User.full_name).where(User.id == company.user_id)
        )
        owner = owner_res.first()
        if owner:
            item.owner_email = owner.email
            item.owner_name = owner.full_name

    return SuccessResponse(data=item)


@router.patch("/{company_id}", response_model=SuccessResponse[AdminCompanyRead])
async def update_company(
    company_id: int,
    data: AdminCompanyUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update company fields."""
    company_repo = CompanyRepository(db)
    company = await company_repo.get_by_id(company_id)
    if not company:
        raise NotFoundException("Company", str(company_id))

    update_data = data.model_dump(exclude_unset=True)
    updated = await company_repo.update(company_id, update_data)

    db.add(AuditLog(
        user_id=admin.id,
        action="company_updated",
        resource_type="company",
        resource_id=company_id,
        details=json.dumps(update_data),
    ))
    await db.commit()
    return SuccessResponse(data=AdminCompanyRead.model_validate(updated))


@router.delete("/{company_id}", response_model=SuccessResponse[dict])
async def delete_company(
    company_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete a company."""
    company_repo = CompanyRepository(db)
    deleted = await company_repo.soft_delete(company_id)
    if not deleted:
        raise NotFoundException("Company", str(company_id))

    db.add(AuditLog(
        user_id=admin.id,
        action="company_deleted",
        resource_type="company",
        resource_id=company_id,
    ))
    await db.commit()
    return SuccessResponse(data={"deleted": True})
