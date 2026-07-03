"""Payment schemas for Click and Payme integrations."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class PaymentCreate(BaseModel):
    """Initiate payment request."""

    plan: str
    provider: str
    return_url: Optional[str] = None


class PaymentRead(BaseModel):
    """Payment record response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    provider: str
    transaction_id: Optional[str] = None
    amount: float
    currency: str
    status: str
    plan: str
    paid_at: Optional[datetime] = None
    created_at: datetime


class ClickWebhookData(BaseModel):
    """Click payment system webhook payload."""

    click_trans_id: int
    service_id: int
    click_paydoc_id: int
    merchant_trans_id: str
    amount: float
    action: int
    error: int
    error_note: str
    sign_time: str
    sign_string: str
    merchant_prepare_id: Optional[int] = None


class PaymeWebhookData(BaseModel):
    """Payme payment system webhook payload."""

    method: str
    params: dict[str, Any]
    id: int
