"""Contract registry — view signed contracts."""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.utils import escape_like as _esc
from app.models.auth.user import User
from app.models.tenders.contract import Contract
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class ContractRead(BaseModel):
    id: int
    contract_number: Optional[str] = None
    tender_id: Optional[int] = None
    title: str
    buyer_name: str
    buyer_stir: Optional[str] = None
    supplier_name: str
    supplier_stir: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None
    amount: Optional[float] = None
    currency: str = "UZS"
    signed_date: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: str
    contract_type: Optional[str] = None
    created_at: str


class ContractStats(BaseModel):
    total: int
    total_amount: float
    by_status: dict
    by_category: dict
    by_region: dict


@router.get("", response_model=SuccessResponse[List[ContractRead]])
async def list_contracts(
    category: Optional[str] = None,
    region: Optional[str] = None,
    status: Optional[str] = None,
    buyer_stir: Optional[str] = None,
    supplier_stir: Optional[str] = None,
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Contract)

    if category:
        query = query.where(Contract.category == category)
    if region:
        query = query.where(Contract.region == region)
    if status:
        query = query.where(Contract.status == status)
    if buyer_stir:
        query = query.where(Contract.buyer_stir == buyer_stir)
    if supplier_stir:
        query = query.where(Contract.supplier_stir == supplier_stir)
    if q:
        query = query.where(
            Contract.title.ilike(f"%{_esc(q)}%", escape="\\") | Contract.buyer_name.ilike(f"%{_esc(q)}%", escape="\\") | Contract.supplier_name.ilike(f"%{_esc(q)}%", escape="\\")
        )

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    result = await db.execute(
        query.order_by(Contract.signed_date.desc().nullslast())
        .offset((page - 1) * size).limit(size)
    )
    contracts = result.scalars().all()

    return SuccessResponse(data=[_to_read(c) for c in contracts], total=total)


@router.get("/stats", response_model=SuccessResponse[ContractStats])
async def contract_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(select(func.count(Contract.id)))).scalar_one()
    total_amount = (await db.execute(
        select(func.coalesce(func.sum(Contract.amount), 0))
    )).scalar_one()

    status_r = await db.execute(
        select(Contract.status, func.count(Contract.id)).group_by(Contract.status)
    )
    cat_r = await db.execute(
        select(Contract.category, func.count(Contract.id))
        .where(Contract.category.isnot(None))
        .group_by(Contract.category).order_by(func.count(Contract.id).desc()).limit(10)
    )
    region_r = await db.execute(
        select(Contract.region, func.count(Contract.id))
        .where(Contract.region.isnot(None))
        .group_by(Contract.region).order_by(func.count(Contract.id).desc()).limit(10)
    )

    return SuccessResponse(data=ContractStats(
        total=total,
        total_amount=float(total_amount),
        by_status={r[0]: r[1] for r in status_r.all()},
        by_category={r[0]: r[1] for r in cat_r.all()},
        by_region={r[0]: r[1] for r in region_r.all()},
    ))


@router.get("/{contract_id}", response_model=SuccessResponse[ContractRead])
async def get_contract(
    contract_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException
    result = await db.execute(select(Contract).where(Contract.id == contract_id))
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="Shartnoma topilmadi")
    return SuccessResponse(data=_to_read(contract))


def _to_read(c: Contract) -> ContractRead:
    return ContractRead(
        id=c.id,
        contract_number=c.contract_number,
        tender_id=c.tender_id,
        title=c.title,
        buyer_name=c.buyer_name,
        buyer_stir=c.buyer_stir,
        supplier_name=c.supplier_name,
        supplier_stir=c.supplier_stir,
        category=c.category,
        region=c.region,
        amount=c.amount,
        currency=c.currency,
        signed_date=str(c.signed_date) if c.signed_date else None,
        start_date=str(c.start_date) if c.start_date else None,
        end_date=str(c.end_date) if c.end_date else None,
        status=c.status,
        contract_type=c.contract_type,
        created_at=str(c.created_at),
    )
