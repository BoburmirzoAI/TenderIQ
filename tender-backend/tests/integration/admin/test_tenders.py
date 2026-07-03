"""Admin Tenders API tests."""

import pytest
from datetime import datetime, timedelta, timezone

BASE = "/api/v1/admin/tenders"


class TestAdminTendersAuth:
    async def test_list_requires_admin(self, client, user_token):
        r = await client.get(BASE, headers=user_token)
        assert r.status_code == 403

    async def test_list_requires_auth(self, client):
        r = await client.get(BASE)
        assert r.status_code == 401


class TestAdminTendersList:
    async def test_list_returns_data(self, client, admin_token, sample_tenders):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True

    async def test_search_by_title(self, client, admin_token, sample_tenders):
        r = await client.get(BASE, params={"search": "Test Tender"}, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_by_source(self, client, admin_token, sample_tenders):
        r = await client.get(BASE, params={"source": "uzex"}, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_by_status(self, client, admin_token, sample_tenders):
        r = await client.get(BASE, params={"status": "active"}, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_by_region(self, client, admin_token, sample_tenders):
        r = await client.get(BASE, params={"region": "Toshkent"}, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_by_category(self, client, admin_token, sample_tenders):
        r = await client.get(BASE, params={"category": "IT"}, headers=admin_token)
        assert r.status_code == 200

    async def test_pagination(self, client, admin_token, sample_tenders):
        r = await client.get(BASE, params={"page": 1, "page_size": 2}, headers=admin_token)
        assert r.status_code == 200


class TestAdminTenderDetail:
    async def test_get_by_id(self, client, admin_token, sample_tenders):
        tid = sample_tenders[0].id
        r = await client.get(f"{BASE}/{tid}", headers=admin_token)
        assert r.status_code == 200
        assert r.json()["data"]["id"] == tid

    async def test_get_nonexistent(self, client, admin_token):
        r = await client.get(f"{BASE}/99999", headers=admin_token)
        assert r.status_code == 404


class TestAdminTenderStats:
    async def test_stats_by_source(self, client, admin_token, sample_tenders):
        r = await client.get(f"{BASE}/stats", headers=admin_token)
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True
        assert "by_source" in data["data"]

    async def test_stats_by_region(self, client, admin_token, sample_tenders):
        r = await client.get(f"{BASE}/stats/by-region", headers=admin_token)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)

    async def test_stats_by_deadline(self, client, admin_token, sample_tenders):
        r = await client.get(f"{BASE}/stats/by-deadline", params={"days": 30}, headers=admin_token)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)

    async def test_stats_by_deadline_custom_days(self, client, admin_token, sample_tenders):
        r = await client.get(f"{BASE}/stats/by-deadline", params={"days": 60}, headers=admin_token)
        assert r.status_code == 200

    async def test_stats_empty_when_no_tenders(self, client, admin_token):
        r = await client.get(f"{BASE}/stats/by-region", headers=admin_token)
        assert r.status_code == 200
        assert r.json()["data"] == []


class TestAdminTenderUpdate:
    async def test_update_tender_status(self, client, admin_token, sample_tenders):
        tid = sample_tenders[0].id
        r = await client.patch(
            f"{BASE}/{tid}",
            json={"status": "closed"},
            headers=admin_token,
        )
        assert r.status_code == 200
        assert r.json()["data"]["status"] == "closed"

    async def test_soft_delete_tender(self, client, admin_token, sample_tenders):
        tid = sample_tenders[0].id
        r = await client.delete(f"{BASE}/{tid}", headers=admin_token)
        assert r.status_code == 200
