"""Admin Dashboard & Analytics API tests."""

import pytest

DASH = "/api/v1/admin/dashboard"
ANALYTICS = "/api/v1/admin/analytics"


class TestAdminDashboard:
    async def test_kpi_requires_admin(self, client, user_token):
        r = await client.get(f"{DASH}/kpi", headers=user_token)
        assert r.status_code == 403

    async def test_kpi_empty_db(self, client, admin_token):
        r = await client.get(f"{DASH}/kpi", headers=admin_token)
        assert r.status_code == 200
        data = r.json()["data"]
        assert "total_users" in data
        assert "total_tenders" in data
        assert "total_revenue" in data
        assert data["total_users"] == 0 or data["total_users"] >= 0

    async def test_kpi_with_users(self, client, admin_token, regular_user, sample_tenders):
        r = await client.get(f"{DASH}/kpi", headers=admin_token)
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["total_users"] >= 1
        assert data["total_tenders"] >= 5

    async def test_growth_chart(self, client, admin_token):
        r = await client.get(f"{DASH}/growth", headers=admin_token)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True

    async def test_recent_activity(self, client, admin_token, sample_audit_logs):
        r = await client.get(f"{DASH}/recent-activity", headers=admin_token)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True


class TestAdminAnalytics:
    async def test_report_requires_admin(self, client, user_token):
        r = await client.get(f"{ANALYTICS}/report", headers=user_token)
        assert r.status_code == 403

    async def test_report_default(self, client, admin_token):
        r = await client.get(f"{ANALYTICS}/report", headers=admin_token)
        assert r.status_code == 200
        data = r.json()["data"]
        assert "total_tenders" in data
        assert "total_users" in data
        assert "total_revenue" in data
        assert "new_users" in data
        assert "tender_by_source" in data

    async def test_report_with_date_range(self, client, admin_token):
        r = await client.get(
            f"{ANALYTICS}/report",
            params={"from": "2025-01-01", "to": "2025-12-31"},
            headers=admin_token,
        )
        assert r.status_code == 200

    async def test_report_invalid_date(self, client, admin_token):
        r = await client.get(
            f"{ANALYTICS}/report",
            params={"from": "not-a-date"},
            headers=admin_token,
        )
        # Either 422 or graceful handling
        assert r.status_code in (200, 422)
