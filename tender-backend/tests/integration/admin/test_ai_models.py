"""Admin AI Models API tests."""

import pytest

BASE = "/api/v1/admin/ai-models"


class TestAdminAIStats:
    async def test_stats_requires_admin(self, client, user_token):
        r = await client.get(f"{BASE}/stats", headers=user_token)
        assert r.status_code == 403

    async def test_stats_empty(self, client, admin_token):
        r = await client.get(f"{BASE}/stats", headers=admin_token)
        assert r.status_code == 200
        data = r.json()["data"]
        assert "total_predictions" in data
        assert "total_matches" in data
        assert "avg_match_score" in data

    async def test_predictions_list(self, client, admin_token):
        r = await client.get(f"{BASE}/predictions", headers=admin_token)
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_predictions_filter_by_status(self, client, admin_token):
        r = await client.get(f"{BASE}/predictions", params={"status": "draft"}, headers=admin_token)
        assert r.status_code == 200

    async def test_predictions_limit(self, client, admin_token):
        r = await client.get(f"{BASE}/predictions", params={"limit": 10}, headers=admin_token)
        assert r.status_code == 200

    async def test_daily_usage(self, client, admin_token):
        r = await client.get(f"{BASE}/usage/daily", headers=admin_token)
        assert r.status_code == 200
        body = r.json()
        assert isinstance(body["data"], list)
        assert len(body["data"]) == 7  # default 7 days

    async def test_daily_usage_custom_days(self, client, admin_token):
        r = await client.get(f"{BASE}/usage/daily", params={"days": 30}, headers=admin_token)
        assert r.status_code == 200
        assert len(r.json()["data"]) == 30

    async def test_top_users(self, client, admin_token):
        r = await client.get(f"{BASE}/usage/top-users", headers=admin_token)
        assert r.status_code == 200
        assert isinstance(r.json()["data"], list)


class TestAdminPricePrediction:
    async def test_predict_price_basic(self, client, admin_token):
        r = await client.post(
            f"{BASE}/predict/price",
            json={"category": "IT", "region": "Toshkent", "amount_min_mln": 100, "amount_max_mln": 500},
            headers=admin_token,
        )
        assert r.status_code == 200
        data = r.json()["data"]
        assert "amount_min_mln" in data
        assert "amount_max_mln" in data
        assert "confidence" in data
        assert data["confidence"] >= 0

    async def test_predict_without_region(self, client, admin_token):
        r = await client.post(
            f"{BASE}/predict/price",
            json={"category": "Qurilish", "amount_min_mln": 200, "amount_max_mln": 800},
            headers=admin_token,
        )
        assert r.status_code == 200

    async def test_predict_returns_fallback_when_no_data(self, client, admin_token):
        r = await client.post(
            f"{BASE}/predict/price",
            json={"category": "Noyob kategoriya XYZ", "region": "Mars"},
            headers=admin_token,
        )
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["confidence"] == 60.0
        assert data["sample_count"] == 0

    async def test_predict_with_tenders_in_db(self, client, admin_token, sample_tenders):
        r = await client.post(
            f"{BASE}/predict/price",
            json={"category": "IT", "region": "Toshkent", "amount_min_mln": 10, "amount_max_mln": 1000},
            headers=admin_token,
        )
        assert r.status_code == 200


class TestAdminPriceStrategy:
    async def test_price_strategy_empty(self, client, admin_token):
        r = await client.get(f"{BASE}/price-strategy", headers=admin_token)
        assert r.status_code == 200
        data = r.json()["data"]
        assert "by_category" in data
        assert "by_region" in data
        assert "bid_history" in data

    async def test_price_strategy_with_tenders(self, client, admin_token, sample_tenders):
        r = await client.get(f"{BASE}/price-strategy", headers=admin_token)
        assert r.status_code == 200
        data = r.json()["data"]
        assert isinstance(data["by_category"], list)
        assert isinstance(data["by_region"], list)
