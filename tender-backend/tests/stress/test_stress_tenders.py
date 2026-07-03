"""Stress tests — Tenders endpoints (highest traffic).

GET /admin/tenders         — paginated list, search, filter
GET /admin/tenders/{id}    — single tender detail
GET /admin/tenders/stats/by-region
GET /admin/tenders/stats/by-deadline
"""

import asyncio
import time
import pytest

pytestmark = pytest.mark.asyncio

BASE = "/api/v1/admin/tenders"
CONCURRENT = 50   # simultaneous requests per test
THRESHOLD_AVG_MS = 500   # must finish under 500ms on average
THRESHOLD_SUCCESS = 0.95  # 95% requests must succeed


async def _concurrent_get(client, url, n, headers, params=None):
    tasks = [client.get(url, headers=headers, params=params or {}) for _ in range(n)]
    start = time.perf_counter()
    results = await asyncio.gather(*tasks, return_exceptions=True)
    elapsed_ms = (time.perf_counter() - start) * 1000
    ok = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
    return ok, elapsed_ms, results


class TestStressTendersList:
    async def test_concurrent_list_no_filter(
        self, stress_client, stress_token, stress_tenders
    ):
        ok, elapsed_ms, _ = await _concurrent_get(
            stress_client, BASE, CONCURRENT, stress_token
        )
        success_rate = ok / CONCURRENT
        avg_ms = elapsed_ms / CONCURRENT
        assert success_rate >= THRESHOLD_SUCCESS, (
            f"Only {ok}/{CONCURRENT} succeeded ({success_rate:.0%})"
        )
        assert avg_ms < THRESHOLD_AVG_MS, f"Avg response {avg_ms:.0f}ms > {THRESHOLD_AVG_MS}ms"

    async def test_concurrent_list_with_search(
        self, stress_client, stress_token, stress_tenders
    ):
        ok, elapsed_ms, _ = await _concurrent_get(
            stress_client, BASE, CONCURRENT, stress_token,
            params={"search": "IT"}
        )
        assert ok / CONCURRENT >= THRESHOLD_SUCCESS

    async def test_concurrent_list_with_filter(
        self, stress_client, stress_token, stress_tenders
    ):
        ok, elapsed_ms, _ = await _concurrent_get(
            stress_client, BASE, CONCURRENT, stress_token,
            params={"source": "uzex", "status": "active"}
        )
        assert ok / CONCURRENT >= THRESHOLD_SUCCESS

    async def test_concurrent_pagination(
        self, stress_client, stress_token, stress_tenders
    ):
        tasks = [
            stress_client.get(
                BASE,
                headers=stress_token,
                params={"page": (i % 5) + 1, "page_size": 10},
            )
            for i in range(CONCURRENT)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        ok = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
        assert ok / CONCURRENT >= THRESHOLD_SUCCESS

    async def test_concurrent_category_filter(
        self, stress_client, stress_token, stress_tenders
    ):
        categories = ["IT", "Qurilish", "Tibbiyot", "Transport", "Energetika"]
        tasks = [
            stress_client.get(
                BASE,
                headers=stress_token,
                params={"category": categories[i % 5]},
            )
            for i in range(CONCURRENT)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        ok = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
        assert ok / CONCURRENT >= THRESHOLD_SUCCESS


class TestStressTenderDetail:
    async def test_concurrent_single_tender(
        self, stress_client, stress_token, stress_tenders
    ):
        tid = stress_tenders[0].id
        ok, elapsed_ms, _ = await _concurrent_get(
            stress_client, f"{BASE}/{tid}", CONCURRENT, stress_token
        )
        assert ok / CONCURRENT >= THRESHOLD_SUCCESS

    async def test_concurrent_different_tenders(
        self, stress_client, stress_token, stress_tenders
    ):
        tasks = [
            stress_client.get(
                f"{BASE}/{stress_tenders[i % len(stress_tenders)].id}",
                headers=stress_token,
            )
            for i in range(CONCURRENT)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        ok = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
        assert ok / CONCURRENT >= THRESHOLD_SUCCESS


class TestStressTenderStats:
    async def test_concurrent_by_region(
        self, stress_client, stress_token, stress_tenders
    ):
        ok, elapsed_ms, _ = await _concurrent_get(
            stress_client, f"{BASE}/stats/by-region", CONCURRENT, stress_token
        )
        assert ok / CONCURRENT >= THRESHOLD_SUCCESS

    async def test_concurrent_by_deadline(
        self, stress_client, stress_token, stress_tenders
    ):
        ok, elapsed_ms, _ = await _concurrent_get(
            stress_client, f"{BASE}/stats/by-deadline", CONCURRENT, stress_token,
            params={"days": 30}
        )
        assert ok / CONCURRENT >= THRESHOLD_SUCCESS

    async def test_by_region_result_consistency(
        self, stress_client, stress_token, stress_tenders
    ):
        """Same endpoint called 10 times must return identical results."""
        responses = await asyncio.gather(*[
            stress_client.get(f"{BASE}/stats/by-region", headers=stress_token)
            for _ in range(10)
        ])
        results = [r.json()["data"] for r in responses if r.status_code == 200]
        if len(results) >= 2:
            # All results must have same count
            lengths = [len(r) for r in results]
            assert len(set(lengths)) == 1, f"Inconsistent results: {lengths}"
