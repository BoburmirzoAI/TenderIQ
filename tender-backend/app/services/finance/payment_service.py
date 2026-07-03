"""Payment service for Click and Payme integration."""

import hashlib
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.constants import PLAN_PRICES_UZS, PaymentStatus, SubscriptionPlan
from app.exceptions import PaymentException, ValidationException
from app.repositories.finance.payment_repo import PaymentRepository
from app.schemas.finance.payment import ClickWebhookData, PaymeWebhookData
from app.services.finance.subscription_service import SubscriptionService

logger = logging.getLogger(__name__)


class PaymentService:
    """Handles payment processing for Click and Payme providers."""

    def __init__(self, session: AsyncSession) -> None:
        self.payment_repo = PaymentRepository(session)
        self.sub_service = SubscriptionService(session)
        self.session = session

    async def create_payment(
        self, user_id: int, plan: str, provider: str
    ) -> dict:
        """Create a pending payment record and return payment URL."""
        subscription_plan = SubscriptionPlan(plan)
        amount = PLAN_PRICES_UZS[subscription_plan]

        if amount <= 0:
            raise ValidationException("Free plan does not require payment")

        payment = await self.payment_repo.create(
            {
                "user_id": user_id,
                "provider": provider,
                "amount": float(amount),
                "currency": "UZS",
                "status": PaymentStatus.PENDING.value,
                "plan": plan,
            }
        )

        payment_url = self._generate_payment_url(provider, payment.id, amount)

        return {
            "payment_id": payment.id,
            "amount": amount,
            "currency": "UZS",
            "provider": provider,
            "payment_url": payment_url,
        }

    async def process_click_webhook(self, data: ClickWebhookData) -> dict:
        """Process Click payment webhook."""
        if not settings.CLICK_SECRET_KEY:
            raise PaymentException("Click secret key not configured")
        expected_sign = self._calculate_click_sign(data)
        if not secrets.compare_digest(data.sign_string, expected_sign):
            raise PaymentException("Invalid signature")

        payment = await self.payment_repo.get_by_id(int(data.merchant_trans_id))
        if not payment:
            return {"error": -5, "error_note": "Payment not found"}

        if data.action == 0:
            return {
                "click_trans_id": data.click_trans_id,
                "merchant_trans_id": data.merchant_trans_id,
                "merchant_prepare_id": payment.id,
                "error": 0,
                "error_note": "Success",
            }

        if data.action == 1:
            if data.error == 0:
                await self._complete_payment(payment.id, str(data.click_trans_id))
                return {
                    "click_trans_id": data.click_trans_id,
                    "merchant_trans_id": data.merchant_trans_id,
                    "merchant_confirm_id": payment.id,
                    "error": 0,
                    "error_note": "Success",
                }
            else:
                await self.payment_repo.update(
                    payment.id,
                    {"status": PaymentStatus.FAILED.value, "error_message": data.error_note},
                )
                return {"error": data.error, "error_note": data.error_note}

        return {"error": -3, "error_note": "Invalid action"}

    async def process_payme_webhook(self, data: PaymeWebhookData) -> dict:
        """Process Payme payment webhook."""
        method = data.method

        if method == "CheckPerformTransaction":
            return await self._payme_check(data)
        elif method == "CreateTransaction":
            return await self._payme_create(data)
        elif method == "PerformTransaction":
            return await self._payme_perform(data)
        elif method == "CancelTransaction":
            return await self._payme_cancel(data)

        return {"error": {"code": -32601, "message": "Method not found"}, "id": data.id}

    async def _complete_payment(self, payment_id: int, transaction_id: str) -> None:
        """Mark payment as completed and activate subscription (idempotent)."""
        payment = await self.payment_repo.get_by_id(payment_id)
        if not payment:
            return

        # Idempotency: already completed payments must not activate subscription again
        if payment.status == PaymentStatus.COMPLETED.value:
            logger.warning("Payment %d already completed, skipping duplicate webhook", payment_id)
            return

        await self.payment_repo.update(
            payment_id,
            {
                "status": PaymentStatus.COMPLETED.value,
                "transaction_id": transaction_id,
                "paid_at": datetime.now(timezone.utc),
            },
        )

        plan = SubscriptionPlan(payment.plan)
        await self.sub_service.activate(payment.user_id, plan)
        logger.info("Payment %d completed, plan %s activated", payment_id, payment.plan)

    def _generate_payment_url(self, provider: str, payment_id: int, amount: float) -> str:
        """Generate payment provider redirect URL."""
        if provider == "click":
            return (
                f"https://my.click.uz/services/pay"
                f"?service_id={settings.CLICK_SERVICE_ID}"
                f"&merchant_id={settings.CLICK_MERCHANT_ID}"
                f"&amount={amount}"
                f"&transaction_param={payment_id}"
            )
        elif provider == "payme":
            return (
                f"https://checkout.paycom.uz/"
                f"?m={settings.PAYME_MERCHANT_ID}"
                f"&ac.order_id={payment_id}"
                f"&a={int(amount * 100)}"
            )
        return ""

    def _calculate_click_sign(self, data: ClickWebhookData) -> str:
        """Calculate Click webhook signature for verification."""
        sign_str = (
            f"{data.click_trans_id}{data.service_id}"
            f"{settings.CLICK_SECRET_KEY}{data.merchant_trans_id}"
            f"{data.amount}{data.action}{data.sign_time}"
        )
        if data.merchant_prepare_id:
            sign_str = (
                f"{data.click_trans_id}{data.service_id}"
                f"{settings.CLICK_SECRET_KEY}{data.merchant_trans_id}"
                f"{data.merchant_prepare_id}{data.amount}{data.action}{data.sign_time}"
            )
        return hashlib.md5(sign_str.encode()).hexdigest()

    async def _payme_check(self, data: PaymeWebhookData) -> dict:
        """Handle Payme CheckPerformTransaction."""
        params = data.params
        order_id = params.get("account", {}).get("order_id")
        if not order_id:
            return {"error": {"code": -31050, "message": "Order not found"}, "id": data.id}

        payment = await self.payment_repo.get_by_id(int(order_id))
        if not payment:
            return {"error": {"code": -31050, "message": "Payment not found"}, "id": data.id}
        if payment.status == PaymentStatus.COMPLETED.value:
            return {"error": {"code": -31099, "message": "Already paid"}, "id": data.id}

        return {"result": {"allow": True}, "id": data.id}

    async def _payme_create(self, data: PaymeWebhookData) -> dict:
        """Handle Payme CreateTransaction — save payme transaction ID to payment."""
        params = data.params
        order_id = params.get("account", {}).get("order_id")
        payme_transaction_id = str(params.get("id", ""))
        now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)

        if order_id:
            payment = await self.payment_repo.get_by_id(int(order_id))
            if payment and payment.status == PaymentStatus.PENDING.value:
                await self.payment_repo.update(
                    int(order_id),
                    {"transaction_id": payme_transaction_id},
                )
                logger.info("Payme CreateTransaction: payment %s linked to tx %s", order_id, payme_transaction_id)

        return {
            "result": {
                "create_time": now_ms,
                "transaction": payme_transaction_id,
                "state": 1,
            },
            "id": data.id,
        }

    async def _payme_perform(self, data: PaymeWebhookData) -> dict:
        """Handle Payme PerformTransaction — complete payment and activate subscription."""
        params = data.params
        order_id = params.get("account", {}).get("order_id")
        payme_transaction_id = str(params.get("id", ""))

        if not order_id:
            return {"error": {"code": -31050, "message": "Order not found"}, "id": data.id}

        await self._complete_payment(int(order_id), payme_transaction_id)

        return {
            "result": {
                "perform_time": int(datetime.now(timezone.utc).timestamp() * 1000),
                "transaction": payme_transaction_id,
                "state": 2,
            },
            "id": data.id,
        }

    async def _payme_cancel(self, data: PaymeWebhookData) -> dict:
        """Handle Payme CancelTransaction — mark payment as failed in DB."""
        params = data.params
        order_id = params.get("account", {}).get("order_id")
        payme_transaction_id = str(params.get("id", ""))
        reason = params.get("reason", 0)

        if order_id:
            payment = await self.payment_repo.get_by_id(int(order_id))
            if payment and payment.status != PaymentStatus.COMPLETED.value:
                await self.payment_repo.update(
                    int(order_id),
                    {
                        "status": PaymentStatus.FAILED.value,
                        "error_message": f"Payme cancel reason={reason}",
                    },
                )
                logger.info(
                    "Payme CancelTransaction: payment %s cancelled, reason=%s", order_id, reason
                )

        return {
            "result": {
                "cancel_time": int(datetime.now(timezone.utc).timestamp() * 1000),
                "transaction": payme_transaction_id,
                "state": -1,
            },
            "id": data.id,
        }
