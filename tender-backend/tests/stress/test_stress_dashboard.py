"""Stress tests — Dashboard KPI (most polled endpoint).

Admin dashboard refreshes KPI every ~30 seconds in production.
Multiple admin users may be online simultaneously.
"""

import asyncio
import time
import pytest

pytestmark = pytest.mark.asyncio

KPI_URL = "/api/v1/admin/dashboard/kpi"
ANALYTICS_URL = "/api/v1/admin/analytics/report"
ACTIVITY_URL = "/api/v1/admin/health/activity"
CONCURRENT = 60
THRESHOLD_SUCCESS = 0.95
THRESHOLD_AVG_MS = 300


class TestStressDashboardKPI:
    async def test_kpi_burst(self, stress_client, stress_token, stress_tenders):
        """Burst of 60 simultaneous KPI requests (admin panel auto-refresh scenario)."""
        start = time.perf_counter()
        results = await asyncio.gather(*[
            stress_client.get(KPI_URL, headers=stress_token)
            for _ in range(CONCURRENT)
        ], return_exceptions=True)
        elapsed_ms = (time.perf_counter() - start) * 1000

        ok = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
        avg_ms = elapsed_ms / CONCURRENT

        assert ok / CONCURRENT >= THRESHOLD_SUCCESS, f"Only {ok}/{CONCURRENT} OK"
        assert avg_ms < THRESHOLD_AVG_MS, f"Avg {avg_ms:.0f}ms exceeds {THRESHOLD_AVG_MS}ms"

    async def test_kpi_wave_pattern(self, stress_client, stress_token):
        """3 waves of 20 requests with 0.1s between waves."""
        all_ok = 0
        total = 0
        for wave in range(3):
            results = await asyncio.gather(*[
                stress_client.get(KPI_URL, headers=stress_token)
                for _ in range(20)
            ], return_exceptions=True)
            all_ok += sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
            total += 20
            await asyncio.sleep(0.1)

        assert all_ok / total >= THRESHOLD_SUCCESS

    async def test_kpi_data_invariants_under_load(self, stress_client, stress_token):
        """KPI fields must always be non-negative regardless of concurrency."""
        results = await asyncio.gather(*[
            stress_client.get(KPI_URL, headers=stress_token)
            for _ in range(20)
        ], return_exceptions=True)

        for r in results:
            if isinstance(r, Exception) or r.status_code != 200:
                continue
            data = r.json()["data"]
            assert data["total_users"] >= 0
            assert data["total_tenders"] >= 0
            assert data.get("total_revenue", 0) >= 0


class TestStressAnalyticsReport:
    async def test_report_concurrent_same_period(self, stress_client, stress_token):
        """30 concurrent report requests for same date range."""
        results = await asyncio.gather(*[
            stress_client.get(
                ANALYTICS_URL,
                params={"from": "2025-01-01", "to": "2025-12-31"},
                headers=stress_token,
            )
            for _ in range(30)
        ], return_exceptions=True)
        ok = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
        assert ok / 30 >= THRESHOLD_SUCCESS

    async def test_report_concurrent_different_periods(self, stress_client, stress_token):
        """30 concurrent report requests for different date ranges."""
        periods = [
            ("2025-01-01", "2025-03-31"),
            ("2025-04-01", "2025-06-30"),
            ("2025-07-01", "2025-09-30"),
            ("2025-10-01", "2025-12-31"),
            ("2024-01-01", "2024-12-31"),
        ]
        results = await asyncio.gather(*[
            stress_client.get(
                ANALYTICS_URL,
                params={"from": periods[i % 5][0], "to": periods[i % 5][1]},
                headers=stress_token,
            )
            for i in range(30)
        ], return_exceptions=True)
        ok = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
        assert ok / 30 >= THRESHOLD_SUCCESS


class TestStressActivityMonitor:
    async def test_activity_concurrent(self, stress_client, stress_token):
        """WebSocket monitor page polls activity every 5s — simulate 25 concurrent polls."""
        results = await asyncio.gather(*[
            stress_client.get(ACTIVITY_URL, headers=stress_token)
            for _ in range(25)
        ], return_exceptions=True)
        ok = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
        assert ok / 25 >= THRESHOLD_SUCCESS
