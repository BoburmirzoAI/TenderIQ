"""Test fixtures and configuration."""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.database import get_db
from app.main import app
from app.models.base import Base
from app.utils.security import create_access_token, hash_password

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def setup_db():
    """Create and drop tables for each test."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a test database session."""
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide a test HTTP client with dependency overrides."""

    async def _override_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user."""
    from app.models.user import User

    user = User(
        email="test@example.com",
        hashed_password=hash_password("testpassword123"),
        full_name="Test User",
        is_active=True,
        telegram_id="123456789",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_admin(db_session: AsyncSession):
    """Create a test admin user."""
    from app.models.user import User

    admin = User(
        email="admin@example.com",
        hashed_password=hash_password("adminpassword123"),
        full_name="Admin User",
        is_active=True,
        is_admin=True,
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin


@pytest.fixture
def auth_headers(test_user):
    """Generate auth headers for test user."""
    token = create_access_token({"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(test_admin):
    """Generate auth headers for admin user."""
    token = create_access_token({"sub": str(test_admin.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def test_company(db_session: AsyncSession, test_user):
    """Create a test company linked to test user."""
    from app.models.company import Company

    company = Company(
        user_id=test_user.id,
        name="Test Company LLC",
        stir="123456789",
        description="IT va qurilish xizmatlari",
        categories=["it", "construction"],
        regions=["tashkent_city", "samarkand"],
        min_amount=10_000_000,
        max_amount=500_000_000,
        keywords="dasturlash qurilish loyiha",
    )
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)
    return company


@pytest.fixture
async def test_tenders(db_session: AsyncSession):
    """Create 10 test tenders with various categories and regions."""
    from app.models.tender import Tender

    tenders_data = [
        {
            "external_id": f"test_{i}",
            "source": "uzex",
            "title": f"Test tender {i}",
            "description": f"Description for tender {i}",
            "organization": f"Organization {i}",
            "category": ["construction", "it", "medical", "food", "transport"][i % 5],
            "region": [
                "tashkent_city",
                "samarkand",
                "bukhara",
                "fergana",
                "andijan",
            ][i % 5],
            "status": "active",
            "amount": (i + 1) * 50_000_000,
            "currency": "UZS",
            "deadline": datetime.now(timezone.utc) + timedelta(days=i + 5),
            "search_text": f"Test tender {i} construction IT dasturlash qurilish",
        }
        for i in range(10)
    ]

    tenders = []
    for data in tenders_data:
        t = Tender(**data)
        db_session.add(t)
        tenders.append(t)
    await db_session.commit()
    for t in tenders:
        await db_session.refresh(t)
    return tenders


@pytest.fixture
async def test_subscription(db_session: AsyncSession, test_user):
    """Create a test subscription."""
    from app.models.subscription import Subscription

    sub = Subscription(
        user_id=test_user.id,
        plan="free",
        is_active=True,
        starts_at=datetime.now(timezone.utc),
    )
    db_session.add(sub)
    await db_session.commit()
    await db_session.refresh(sub)
    return sub


@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    redis_mock = AsyncMock()
    redis_mock.get = AsyncMock(return_value=None)
    redis_mock.set = AsyncMock()
    redis_mock.delete = AsyncMock()
    redis_mock.exists = AsyncMock(return_value=False)
    redis_mock.incr = AsyncMock(return_value=1)
    redis_mock.incrby = AsyncMock(return_value=1)
    redis_mock.expire = AsyncMock()
    redis_mock.close = AsyncMock()
    return redis_mock
