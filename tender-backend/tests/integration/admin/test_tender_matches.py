"""Admin Tender Matches API tests."""

import pytest

BASE = "/api/v1/admin/tender-matches"


class TestAdminTenderMatchesAuth:
    async def test_requires_admin(self, client, user_token):
        r = await client.get(BASE, headers=user_token)
        assert r.status_code == 403


class TestAdminTenderMatchesList:
    async def test_list_empty(self, client, admin_token):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_stats_endpoint(self, client, admin_token):
        r = await client.get(f"{BASE}/stats", headers=admin_token)
        assert r.status_code == 200

    async def test_filter_by_min_score(self, client, admin_token):
        r = await client.get(BASE, params={"min_score": 0.7}, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_notified(self, client, admin_token):
        r = await client.get(BASE, params={"is_notified": True}, headers=admin_token)
        assert r.status_code == 200
