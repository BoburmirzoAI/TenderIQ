"""Payment endpoints and webhook handlers."""

import base64
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.base import SuccessResponse
from app.schemas.payment import ClickWebhookData, PaymeWebhookData, PaymentCreate, PaymentRead
from app.services.payment_service import PaymentService

router = APIRouter()


@router.post("/create", response_model=SuccessResponse[dict])
async def create_payment(
    data: PaymentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Initiate a payment for a subscription plan."""
    service = PaymentService(db)
    result = await service.create_payment(user.id, data.plan, data.provider)
    return SuccessResponse(data=result)


@router.post("/click/webhook")
async def click_webhook(data: ClickWebhookData, db: AsyncSession = Depends(get_db)):
    """Handle Click payment system callbacks."""
    service = PaymentService(db)
    result = await service.process_click_webhook(data)
    return result


def _verify_payme_auth(request: Request) -> None:
    """Verify Payme Basic Auth header against PAYME_SECRET_KEY."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Basic "):
        raise HTTPException(status_code=401, detail="Missing auth")
    try:
        decoded = base64.b64decode(auth[6:]).decode("utf-8")
        _, password = decoded.split(":", 1)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid auth")
    if not secrets.compare_digest(password, settings.PAYME_SECRET_KEY):
        raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/payme/webhook")
async def payme_webhook(
    request: Request,
    data: PaymeWebhookData,
    db: AsyncSession = Depends(get_db),
):
    """Handle Payme payment system callbacks."""
    _verify_payme_auth(request)
    service = PaymentService(db)
    result = await service.process_payme_webhook(data)
    return result


@router.get("/history", response_model=SuccessResponse[list[PaymentRead]])
async def payment_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's payment history."""
    from app.repositories.payment_repo import PaymentRepository

    repo = PaymentRepository(db)
    payments = await repo.get_for_user(user.id)
    return SuccessResponse(data=[PaymentRead.model_validate(p) for p in payments])
