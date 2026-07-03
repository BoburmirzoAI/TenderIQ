"""Admin Audit Log API tests."""

import pytest

BASE = "/api/v1/admin/audit-log"


class TestAdminAuditLogAuth:
    async def test_requires_admin(self, client, user_token):
        r = await client.get(BASE, headers=user_token)
        assert r.status_code == 403

    async def test_requires_auth(self, client):
        r = await client.get(BASE)
        assert r.status_code == 401


class TestAdminAuditLogList:
    async def test_list_empty(self, client, admin_token):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_list_with_logs(self, client, admin_token, sample_audit_logs):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True

    async def test_filter_by_action(self, client, admin_token, sample_audit_logs):
        r = await client.get(BASE, params={"action": "login"}, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_by_user_id(self, client, admin_token, admin_user, sample_audit_logs):
        r = await client.get(BASE, params={"user_id": admin_user.id}, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_by_resource_type(self, client, admin_token, sample_audit_logs):
        r = await client.get(BASE, params={"resource_type": "tender"}, headers=admin_token)
        assert r.status_code == 200

    async def test_pagination(self, client, admin_token, sample_audit_logs):
        r = await client.get(BASE, params={"page": 1, "page_size": 3}, headers=admin_token)
        assert r.status_code == 200

    async def test_stats_endpoint(self, client, admin_token, sample_audit_logs):
        r = await client.get(f"{BASE}/stats", headers=admin_token)
        assert r.status_code == 200
