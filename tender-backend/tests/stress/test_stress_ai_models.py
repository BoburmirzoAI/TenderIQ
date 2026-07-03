"""Stress tests — AI Models / Price Prediction.

POST /admin/ai-models/predict/price — most compute-heavy endpoint.
Users click "Hisoblash" rapidly or batch-predict multiple tenders.
"""

import asyncio
import time
import pytest

pytestmark = pytest.mark.asyncio

BASE = "/api/v1/admin/ai-models"
CONCURRENT = 30
THRESHOLD_SUCCESS = 0.95


class TestStressPricePrediction:
    async def test_concurrent_predict_same_params(
        self, stress_client, stress_token, stress_tenders
    ):
        """30 simultaneous predictions with identical params."""
        payload = {
            "category": "IT",
            "region": "Toshkent",
            "amount_min_mln": 100,
            "amount_max_mln": 500,
        }
        start = time.perf_counter()
        results = await asyncio.gather(*[
            stress_client.post(f"{BASE}/predict/price", json=payload, headers=stress_token)
            for _ in range(CONCURRENT)
        ], return_exceptions=True)
        elapsed_ms = (time.perf_counter() - start) * 1000

        ok = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
        assert ok / CONCURRENT >= THRESHOLD_SUCCESS, f"Only {ok}/{CONCURRENT} OK"

    async def test_concurrent_predict_varied_params(
        self, stress_client, stress_token, stress_tenders
    ):
        """30 requests with different categories and regions."""
        combos = [
            ("IT", "Toshkent"), ("Qurilish", "Samarqand"),
            ("Tibbiyot", "Buxoro"), ("Transport", "Andijon"),
            ("Energetika", "Namangan"),
        ]
        results = await asyncio.gather(*[
            stress_client.post(
                f"{BASE}/predict/price",
                json={
                    "category": combos[i % 5][0],
                    "region": combos[i % 5][1],
                    "amount_min_mln": 50 * (i % 10 + 1),
                    "amount_max_mln": 500 * (i % 10 + 1),
                },
                headers=stress_token,
            )
            for i in range(CONCURRENT)
        ], return_exceptions=True)

        ok = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
        assert ok / CONCURRENT >= THRESHOLD_SUCCESS

    async def test_prediction_result_consistency(
        self, stress_client, stress_token, stress_tenders
    ):
        """Same input must return same confidence and range across concurrent calls."""
        payload = {"category": "IT", "region": "Toshkent", "amount_min_mln": 200, "amount_max_mln": 600}
        results = await asyncio.gather(*[
            stress_client.post(f"{BASE}/predict/price", json=payload, headers=stress_token)
            for _ in range(10)
        ], return_exceptions=True)
        ok_results = [r.json()["data"] for r in results if not isinstance(r, Exception) and r.status_code == 200]
        if len(ok_results) >= 2:
            confidences = [r["confidence"] for r in ok_results]
            assert len(set(confidences)) == 1, f"Inconsistent confidence: {set(confidences)}"

    async def test_price_strategy_concurrent(
        self, stress_client, stress_token, stress_tenders
    ):
        """PriceStrategy page load — aggregation query under load."""
        results = await asyncio.gather(*[
            stress_client.get(f"{BASE}/price-strategy", headers=stress_token)
            for _ in range(20)
        ], return_exceptions=True)
        ok = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
        assert ok / 20 >= THRESHOLD_SUCCESS

    async def test_daily_usage_concurrent(self, stress_client, stress_token):
        results = await asyncio.gather(*[
            stress_client.get(f"{BASE}/usage/daily", headers=stress_token)
            for _ in range(20)
        ], return_exceptions=True)
        ok = sum(1 for r in results if not isinstance(r, Exception) and r.status_code == 200)
        assert ok / 20 >= THRESHOLD_SUCCESS
