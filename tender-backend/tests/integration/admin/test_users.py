"""Admin Users API tests."""

import pytest

BASE = "/api/v1/admin/users"


class TestAdminUsersAuth:
    async def test_list_requires_admin(self, client, user_token):
        r = await client.get(BASE, headers=user_token)
        assert r.status_code == 403

    async def test_list_requires_auth(self, client):
        r = await client.get(BASE)
        assert r.status_code == 401


class TestAdminUsersList:
    async def test_list_returns_success(self, client, admin_token, regular_user):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True
        assert "items" in data["data"] or isinstance(data["data"], list)

    async def test_list_pagination(self, client, admin_token):
        r = await client.get(BASE, params={"page": 1, "page_size": 5}, headers=admin_token)
        assert r.status_code == 200

    async def test_search_by_email(self, client, admin_token, regular_user):
        r = await client.get(BASE, params={"search": "user@test.com"}, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_active(self, client, admin_token, regular_user):
        r = await client.get(BASE, params={"is_active": True}, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_admin_only(self, client, admin_token):
        r = await client.get(BASE, params={"is_admin": True}, headers=admin_token)
        assert r.status_code == 200


class TestAdminUserDetail:
    async def test_get_user_by_id(self, client, admin_token, regular_user):
        r = await client.get(f"{BASE}/{regular_user.id}", headers=admin_token)
        assert r.status_code == 200
        assert r.json()["data"]["id"] == regular_user.id

    async def test_get_nonexistent_user(self, client, admin_token):
        r = await client.get(f"{BASE}/99999", headers=admin_token)
        assert r.status_code == 404


class TestAdminUserUpdate:
    async def test_update_user_name(self, client, admin_token, regular_user):
        r = await client.patch(
            f"{BASE}/{regular_user.id}",
            json={"full_name": "Updated Name"},
            headers=admin_token,
        )
        assert r.status_code == 200
        assert r.json()["data"]["full_name"] == "Updated Name"

    async def test_toggle_user_active(self, client, admin_token, regular_user):
        r = await client.patch(
            f"{BASE}/{regular_user.id}",
            json={"is_active": False},
            headers=admin_token,
        )
        assert r.status_code == 200
        assert r.json()["data"]["is_active"] is False

    async def test_update_nonexistent_user(self, client, admin_token):
        r = await client.patch(
            f"{BASE}/99999",
            json={"full_name": "Ghost"},
            headers=admin_token,
        )
        assert r.status_code == 404


class TestAdminUserDelete:
    async def test_delete_user(self, client, admin_token, regular_user):
        r = await client.delete(f"{BASE}/{regular_user.id}", headers=admin_token)
        assert r.status_code == 200

    async def test_delete_nonexistent(self, client, admin_token):
        r = await client.delete(f"{BASE}/99999", headers=admin_token)
        assert r.status_code == 404
