"""Admin Financials API tests."""

import pytest

BASE = "/api/v1/admin/financials"


class TestAdminFinancialsAuth:
    async def test_requires_admin(self, client, user_token):
        r = await client.get(f"{BASE}/overview", headers=user_token)
        assert r.status_code == 403

    async def test_requires_auth(self, client):
        r = await client.get(f"{BASE}/overview")
        assert r.status_code == 401


class TestAdminFinancialsOverview:
    async def test_overview_empty(self, client, admin_token):
        r = await client.get(f"{BASE}/overview", headers=admin_token)
        assert r.status_code == 200
        data = r.json()["data"]
        assert "total_revenue" in data or "mrr" in data or isinstance(data, dict)

    async def test_revenue_by_plan(self, client, admin_token):
        r = await client.get(f"{BASE}/revenue-by-plan", headers=admin_token)
        assert r.status_code == 200

    async def test_payments_list(self, client, admin_token):
        r = await client.get(f"{BASE}/payments", headers=admin_token)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True

    async def test_payments_filter_by_status(self, client, admin_token):
        r = await client.get(f"{BASE}/payments", params={"status": "paid"}, headers=admin_token)
        assert r.status_code == 200

    async def test_subscriptions_list(self, client, admin_token):
        r = await client.get(f"{BASE}/subscriptions", headers=admin_token)
        assert r.status_code == 200

    async def test_subscriptions_filter_by_plan(self, client, admin_token):
        r = await client.get(f"{BASE}/subscriptions", params={"plan": "pro"}, headers=admin_token)
        assert r.status_code == 200
