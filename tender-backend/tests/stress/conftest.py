"""Stress test fixtures and config.

Run with:  pytest tests/stress/ -v --timeout=120
These tests send N concurrent requests and measure response times.
"""

import asyncio
import time
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import get_db
from app.main import app
from app.models.base import Base
from app.models.auth.user import User
from app.models.tenders.tender import Tender
from app.utils.security import create_access_token, hash_password
from datetime import datetime, timedelta, timezone

STRESS_DB_URL = "sqlite+aiosqlite:///./stress_test.db"

stress_engine = create_async_engine(STRESS_DB_URL, echo=False)
StressSession = async_sessionmaker(stress_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="module")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="module")
async def stress_db():
    async with stress_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with stress_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await stress_engine.dispose()


@pytest.fixture(scope="module")
async def stress_session(stress_db):
    async with StressSession() as session:
        yield session


@pytest.fixture(scope="module")
async def stress_admin(stress_session):
    admin = User(
        email="stressadmin@test.com",
        hashed_password=hash_password("adminpass123"),
        full_name="Stress Admin",
        is_active=True,
        is_admin=True,
        is_superadmin=True,
    )
    stress_session.add(admin)
    await stress_session.commit()
    await stress_session.refresh(admin)
    return admin


@pytest.fixture(scope="module")
async def stress_token(stress_admin):
    return {"Authorization": f"Bearer {create_access_token({'sub': str(stress_admin.id)})}"}


@pytest.fixture(scope="module")
async def stress_tenders(stress_session):
    """Create 100 tenders for stress testing search/filter."""
    now = datetime.now(timezone.utc)
    tenders = []
    sources = ["uzex", "mc", "mygov"]
    categories = ["IT", "Qurilish", "Tibbiyot", "Transport", "Energetika"]
    regions = ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Namangan"]

    for i in range(100):
        t = Tender(
            external_id=f"STRESS-{i:04d}",
            source=sources[i % 3],
            title=f"Stress Test Tender {i} - {categories[i % 5]}",
            organization=f"Stress Org {i % 20}",
            category=categories[i % 5],
            region=regions[i % 5],
            status="active" if i % 4 != 0 else "closed",
            amount=(i + 1) * 50_000_000,
            currency="UZS",
            deadline=now + timedelta(days=i % 60 + 1),
        )
        stress_session.add(t)
        tenders.append(t)

    await stress_session.commit()
    for t in tenders:
        await stress_session.refresh(t)
    return tenders


@pytest.fixture(scope="module")
async def stress_client(stress_session):
    async def _override_db():
        yield stress_session

    app.dependency_overrides[get_db] = _override_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


async def run_concurrent(client, method: str, url: str, n: int, headers: dict, **kwargs):
    """Run N concurrent requests and return (success_count, avg_ms, max_ms)."""
    tasks = [getattr(client, method)(url, headers=headers, **kwargs) for _ in range(n)]
    start = time.perf_counter()
    results = await asyncio.gather(*tasks, return_exceptions=True)
    total_ms = (time.perf_counter() - start) * 1000

    successes = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
    return successes, total_ms / n, max(
        (time.perf_counter() - start) * 1000 for _ in [1]
    ), results
