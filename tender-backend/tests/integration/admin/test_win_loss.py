"""Admin Win/Loss Journal API tests."""

import pytest

BASE = "/api/v1/admin/win-loss"


class TestAdminWinLossAuth:
    async def test_requires_admin(self, client, user_token):
        r = await client.get(BASE, headers=user_token)
        assert r.status_code == 403


class TestAdminWinLossOverview:
    async def test_overview_empty(self, client, admin_token):
        r = await client.get(f"{BASE}/stats", headers=admin_token)
        assert r.status_code == 200
        data = r.json()["data"]
        assert isinstance(data, dict)

    async def test_overview_with_results(self, client, admin_token, sample_tender_results):
        r = await client.get(f"{BASE}/stats", headers=admin_token)
        assert r.status_code == 200

    async def test_list_endpoint(self, client, admin_token):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_list_with_data(self, client, admin_token, sample_tender_results):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_by_user(self, client, admin_token, regular_user):
        r = await client.get(BASE, params={"user_id": regular_user.id}, headers=admin_token)
        assert r.status_code == 200

    async def test_stats_endpoint(self, client, admin_token, sample_tender_results):
        r = await client.get(f"{BASE}/stats", headers=admin_token)
        assert r.status_code == 200
