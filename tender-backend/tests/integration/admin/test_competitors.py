"""Admin Competitors API tests."""

import pytest

BASE = "/api/v1/admin/competitors"


class TestAdminCompetitorsAuth:
    async def test_requires_admin(self, client, user_token):
        r = await client.get(f"{BASE}/overview", headers=user_token)
        assert r.status_code == 403

    async def test_requires_auth(self, client):
        r = await client.get(f"{BASE}/overview")
        assert r.status_code == 401


class TestAdminCompetitorsOverview:
    async def test_overview_empty_db(self, client, admin_token):
        r = await client.get(f"{BASE}/overview", headers=admin_token)
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["total_companies"] == 0
        assert data["total_tenders"] == 0
        assert data["top"] == []
        assert data["by_category"] == []

    async def test_overview_with_results(self, client, admin_token, sample_tender_results):
        r = await client.get(f"{BASE}/overview", headers=admin_token)
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["total_companies"] >= 1
        assert data["total_tenders"] >= 3
        assert len(data["top"]) >= 1

    async def test_overview_top_competitor_fields(self, client, admin_token, sample_tender_results):
        r = await client.get(f"{BASE}/overview", headers=admin_token)
        top = r.json()["data"]["top"]
        if top:
            comp = top[0]
            assert "name" in comp
            assert "wins" in comp
            assert "total_amount" in comp
            assert "avg_amount" in comp

    async def test_overview_limit_param(self, client, admin_token, sample_tender_results):
        r = await client.get(f"{BASE}/overview", params={"limit": 5}, headers=admin_token)
        assert r.status_code == 200

    async def test_overview_limit_min(self, client, admin_token):
        r = await client.get(f"{BASE}/overview", params={"limit": 5}, headers=admin_token)
        assert r.status_code == 200

    async def test_overview_limit_too_small(self, client, admin_token):
        r = await client.get(f"{BASE}/overview", params={"limit": 1}, headers=admin_token)
        assert r.status_code == 422  # ge=5

    async def test_by_category_with_tenders(self, client, admin_token, sample_tenders):
        r = await client.get(f"{BASE}/overview", headers=admin_token)
        assert r.status_code == 200
        data = r.json()["data"]
        assert isinstance(data["by_category"], list)
