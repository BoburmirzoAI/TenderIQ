"""Company profile management endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.auth.user import User
from app.schemas.base import SuccessResponse
from app.schemas.companies.company import CompanyCreate, CompanyRead, CompanyUpdate
from app.services.companies.company_service import CompanyService

router = APIRouter()


@router.post("/", response_model=SuccessResponse[CompanyRead])
async def create_company(
    data: CompanyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a company profile for the current user."""
    service = CompanyService(db)
    company = await service.create_profile(user.id, data)
    return SuccessResponse(data=company, message="Company created")


@router.get("/me", response_model=SuccessResponse[CompanyRead])
async def get_my_company(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's company profile."""
    service = CompanyService(db)
    company = await service.get_profile(user.id)
    return SuccessResponse(data=company)


@router.patch("/me", response_model=SuccessResponse[CompanyRead])
async def update_my_company(
    data: CompanyUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's company profile."""
    service = CompanyService(db)
    company = await service.update_profile(user.id, data)
    return SuccessResponse(data=company, message="Company updated")


@router.get("/stats", response_model=SuccessResponse[dict])
async def get_company_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get matching statistics for the user's company."""
    service = CompanyService(db)
    stats = await service.get_stats(user.id)
    return SuccessResponse(data=stats)
