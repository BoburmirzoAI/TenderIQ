"""Seed the database with test data."""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed() -> None:
    """Create test users, companies, and tenders."""
    from app.database import async_session, create_db_tables
    from app.models.companies.company import Company
    from app.models.finance.subscription import Subscription
    from app.models.tenders.tender import Tender
    from app.models.auth.user import User
    from app.utils.security import hash_password

    await create_db_tables()

    async with async_session() as session:
        user = User(
            email="demo@tenderiq.uz",
            hashed_password=hash_password("demo1234"),
            full_name="Demo User",
            is_active=True,
            telegram_id="111222333",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        company = Company(
            user_id=user.id,
            name="Demo Company LLC",
            stir="999888777",
            description="IT va dasturlash xizmatlari",
            categories=["it", "consulting"],
            regions=["tashkent_city", "samarkand"],
            min_amount=50_000_000,
            max_amount=1_000_000_000,
            keywords="dasturlash loyiha web mobile",
        )
        session.add(company)

        sub = Subscription(
            user_id=user.id,
            plan="free",
            is_active=True,
            starts_at=datetime.now(timezone.utc),
        )
        session.add(sub)

        categories = ["construction", "it", "medical", "food", "transport"]
        regions = ["tashkent_city", "samarkand", "bukhara", "fergana", "andijan"]

        for i in range(20):
            tender = Tender(
                external_id=f"seed_{i}",
                source="uzex" if i % 2 == 0 else "mc",
                title=f"Seed tender {i}: {categories[i % 5]} loyihasi",
                description=f"Tender tavsifi {i}. {categories[i % 5]} sohasida xizmat ko'rsatish.",
                organization=f"Tashkilot {i}",
                category=categories[i % 5],
                region=regions[i % 5],
                status="active",
                amount=(i + 1) * 25_000_000,
                currency="UZS",
                deadline=datetime.now(timezone.utc) + timedelta(days=i + 3),
                search_text=f"seed tender {i} {categories[i % 5]}",
            )
            session.add(tender)

        await session.commit()
        logger.info("Seed data created: 1 user, 1 company, 20 tenders")


if __name__ == "__main__":
    asyncio.run(seed())
