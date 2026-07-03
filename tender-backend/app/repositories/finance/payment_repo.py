"""Payment repository for payment history."""

from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.finance.payment import Payment
from app.repositories.base import BaseRepository


class PaymentRepository(BaseRepository[Payment]):
    """Repository for payment transaction data access."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Payment, session)

    async def get_by_transaction_id(self, transaction_id: str) -> Optional[Payment]:
        """Find payment by provider transaction ID."""
        result = await self.session.execute(
            select(Payment).where(Payment.transaction_id == transaction_id)
        )
        return result.scalar_one_or_none()

    async def get_for_user(
        self, user_id: int, skip: int = 0, limit: int = 20
    ) -> list[Payment]:
        """Fetch payment history for a user."""
        result = await self.session.execute(
            select(Payment)
            .where(Payment.user_id == user_id)
            .order_by(Payment.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_total_revenue(self) -> float:
        """Calculate total completed payment amount."""
        result = await self.session.execute(
            select(func.sum(Payment.amount)).where(Payment.status == "completed")
        )
        return float(result.scalar_one() or 0)
