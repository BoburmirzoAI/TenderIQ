"""Stress tests — Auth endpoints.

Login is the most attacked endpoint in any system.
We verify the rate limiter works and the server stays up under load.
"""

import asyncio
import time
import pytest

pytestmark = pytest.mark.asyncio

LOGIN_URL = "/api/v1/auth/login"
REFRESH_URL = "/api/v1/auth/refresh"
ME_URL = "/api/v1/auth/me"
CONCURRENT = 50


class TestStressLogin:
    async def test_failed_logins_dont_crash_server(self, stress_client):
        """50 bad-credential requests — server must stay up (rate limiter may kick in)."""
        results = await asyncio.gather(*[
            stress_client.post(
                LOGIN_URL,
                json={"email": "ghost@example.com", "password": "wrongpass"},
            )
            for _ in range(CONCURRENT)
        ], return_exceptions=True)

        exception_count = sum(1 for r in results if isinstance(r, Exception))
        # Server should not throw unhandled exceptions
        assert exception_count == 0

        status_codes = [r.status_code for r in results if not isinstance(r, Exception)]
        # All must be 401 (wrong creds) or 429 (rate limited) — never 500
        assert all(s in (401, 422, 429) for s in status_codes), (
            f"Unexpected status codes: {set(status_codes)}"
        )

    async def test_valid_login_burst(self, stress_client, stress_admin):
        """10 concurrent valid logins — all must succeed or be rate-limited."""
        results = await asyncio.gather(*[
            stress_client.post(
                LOGIN_URL,
                json={"email": "stressadmin@test.com", "password": "adminpass123"},
            )
            for _ in range(10)
        ], return_exceptions=True)

        status_codes = [r.status_code for r in results if not isinstance(r, Exception)]
        # Must be 200 (success) or 429 (rate limited)
        assert all(s in (200, 429) for s in status_codes)
        assert 500 not in status_codes


class TestStressTokenRefresh:
    async def test_concurrent_refresh_invalid_token(self, stress_client):
        """30 concurrent invalid refresh token attempts — no 500."""
        results = await asyncio.gather(*[
            stress_client.post(
                REFRESH_URL,
                json={"refresh_token": "invalid.token.here"},
            )
            for _ in range(30)
        ], return_exceptions=True)

        status_codes = [r.status_code for r in results if not isinstance(r, Exception)]
        assert all(s in (401, 422) for s in status_codes)


class TestStressProtectedEndpoints:
    async def test_concurrent_me_endpoint(self, stress_client, stress_token):
        """50 simultaneous /me requests — common pattern in SPA apps."""
        results = await asyncio.gather(*[
            stress_client.get(ME_URL, headers=stress_token)
            for _ in range(CONCURRENT)
        ], return_exceptions=True)
        ok = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
        assert ok / CONCURRENT >= 0.95

    async def test_unauthorized_burst(self, stress_client):
        """50 requests without token — must all return 401, never 500."""
        results = await asyncio.gather(*[
            stress_client.get("/api/v1/admin/dashboard/kpi")
            for _ in range(CONCURRENT)
        ], return_exceptions=True)
        status_codes = [r.status_code for r in results if not isinstance(r, Exception)]
        assert all(s == 401 for s in status_codes)
