"""Stress tests — Users endpoints.

GET /admin/users          — list/search
GET /admin/users/{id}     — detail
PATCH /admin/users/{id}   — update (write stress)
"""

import asyncio
import time
import pytest

pytestmark = pytest.mark.asyncio

BASE = "/api/v1/admin/users"
CONCURRENT = 40
THRESHOLD_SUCCESS = 0.95


async def _many(client, coros):
    results = await asyncio.gather(*coros, return_exceptions=True)
    ok = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
    return ok, results


class TestStressUsersList:
    async def test_concurrent_list(self, stress_client, stress_token, stress_admin):
        ok, _ = await _many(stress_client, [
            stress_client.get(BASE, headers=stress_token)
            for _ in range(CONCURRENT)
        ])
        assert ok / CONCURRENT >= THRESHOLD_SUCCESS

    async def test_concurrent_search(self, stress_client, stress_token, stress_admin):
        terms = ["stress", "admin", "test", "@test.com", ""]
        ok, _ = await _many(stress_client, [
            stress_client.get(BASE, params={"search": terms[i % len(terms)]}, headers=stress_token)
            for i in range(CONCURRENT)
        ])
        assert ok / CONCURRENT >= THRESHOLD_SUCCESS

    async def test_concurrent_pagination(self, stress_client, stress_token, stress_admin):
        ok, _ = await _many(stress_client, [
            stress_client.get(BASE, params={"page": (i % 3) + 1, "page_size": 5}, headers=stress_token)
            for i in range(CONCURRENT)
        ])
        assert ok / CONCURRENT >= THRESHOLD_SUCCESS


class TestStressUserDetail:
    async def test_concurrent_get_same_user(self, stress_client, stress_token, stress_admin):
        ok, _ = await _many(stress_client, [
            stress_client.get(f"{BASE}/{stress_admin.id}", headers=stress_token)
            for _ in range(CONCURRENT)
        ])
        assert ok / CONCURRENT >= THRESHOLD_SUCCESS

    async def test_concurrent_get_nonexistent(self, stress_client, stress_token):
        """404 under load — server must not crash."""
        results = await asyncio.gather(*[
            stress_client.get(f"{BASE}/99999", headers=stress_token)
            for _ in range(20)
        ], return_exceptions=True)
        status_codes = [r.status_code for r in results if not isinstance(r, Exception)]
        assert all(s == 404 for s in status_codes)


class TestStressUsersWrite:
    async def test_concurrent_updates_no_race(
        self, stress_client, stress_token, stress_admin
    ):
        """10 concurrent PATCH requests — last write wins, no 500 errors."""
        results = await asyncio.gather(*[
            stress_client.patch(
                f"{BASE}/{stress_admin.id}",
                json={"full_name": f"Stress Admin v{i}"},
                headers=stress_token,
            )
            for i in range(10)
        ], return_exceptions=True)
        status_codes = [r.status_code for r in results if not isinstance(r, Exception)]
        assert all(s in (200, 409) for s in status_codes)
        assert 200 in status_codes
