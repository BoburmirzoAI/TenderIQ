"""Admin Health & Activity API tests."""

import pytest

BASE = "/api/v1/admin/health"


class TestAdminHealthAuth:
    async def test_status_requires_admin(self, client, user_token):
        r = await client.get(BASE, headers=user_token)
        assert r.status_code == 403

    async def test_status_requires_auth(self, client):
        r = await client.get(BASE)
        assert r.status_code == 401


class TestAdminHealthStatus:
    async def test_health_status(self, client, admin_token):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        data = r.json()["data"]
        assert isinstance(data, dict)


class TestAdminActivityMonitor:
    async def test_activity_empty(self, client, admin_token):
        r = await client.get(f"{BASE}/activity", headers=admin_token)
        assert r.status_code == 200
        data = r.json()["data"]
        assert "recent_actions" in data
        assert "unique_users" in data
        assert "events" in data
        assert "channels" in data

    async def test_activity_with_logs(self, client, admin_token, sample_audit_logs):
        r = await client.get(f"{BASE}/activity", headers=admin_token)
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["recent_actions"] >= 5
        assert isinstance(data["events"], list)
        assert len(data["events"]) >= 1

    async def test_activity_events_schema(self, client, admin_token, sample_audit_logs):
        r = await client.get(f"{BASE}/activity", headers=admin_token)
        events = r.json()["data"]["events"]
        if events:
            e = events[0]
            assert "id" in e
            assert "action" in e
            assert "resource_type" in e
            assert "created_at" in e

    async def test_activity_custom_limit(self, client, admin_token, sample_audit_logs):
        r = await client.get(f"{BASE}/activity", params={"limit": 3}, headers=admin_token)
        assert r.status_code == 200
        events = r.json()["data"]["events"]
        assert len(events) <= 3

    async def test_activity_channels_dict(self, client, admin_token, sample_audit_logs):
        r = await client.get(f"{BASE}/activity", headers=admin_token)
        channels = r.json()["data"]["channels"]
        assert isinstance(channels, dict)
