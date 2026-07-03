"""Admin Notifications API tests."""

import pytest

BASE = "/api/v1/admin/notifications"


class TestAdminNotificationsAuth:
    async def test_requires_admin(self, client, user_token):
        r = await client.get(BASE, headers=user_token)
        assert r.status_code == 403


class TestAdminNotificationsList:
    async def test_list_empty(self, client, admin_token):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_filter_by_channel(self, client, admin_token):
        r = await client.get(BASE, params={"channel": "telegram"}, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_by_user(self, client, admin_token, regular_user):
        r = await client.get(BASE, params={"user_id": regular_user.id}, headers=admin_token)
        assert r.status_code == 200

    async def test_pagination(self, client, admin_token):
        r = await client.get(BASE, params={"page": 1, "page_size": 20}, headers=admin_token)
        assert r.status_code == 200


class TestAdminNotificationsBroadcast:
    async def test_broadcast_requires_admin(self, client, user_token):
        r = await client.post(f"{BASE}/broadcast", json={"message": "Test"}, headers=user_token)
        assert r.status_code == 403

    async def test_broadcast_to_all(self, client, admin_token, regular_user):
        r = await client.post(
            f"{BASE}/broadcast",
            json={"title": "System Notice", "message": "Texnik ishlar", "channel": "system"},
            headers=admin_token,
        )
        assert r.status_code in (200, 201)

    async def test_stats_endpoint(self, client, admin_token):
        r = await client.get(f"{BASE}/stats", headers=admin_token)
        assert r.status_code == 200
