"""Admin API Keys tests."""

import pytest

BASE = "/api/v1/admin/api-keys"


class TestAdminAPIKeysAuth:
    async def test_requires_admin(self, client, user_token):
        r = await client.get(BASE, headers=user_token)
        assert r.status_code == 403

    async def test_requires_auth(self, client):
        r = await client.get(BASE)
        assert r.status_code == 401


class TestAdminAPIKeysList:
    async def test_list_empty(self, client, admin_token):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_list_with_key(self, client, admin_token, sample_api_key):
        key_obj, _ = sample_api_key
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_by_user(self, client, admin_token, regular_user, sample_api_key):
        r = await client.get(BASE, params={"user_id": regular_user.id}, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_active(self, client, admin_token, sample_api_key):
        r = await client.get(BASE, params={"is_active": True}, headers=admin_token)
        assert r.status_code == 200


class TestAdminAPIKeysCreate:
    async def test_create_key(self, client, admin_token, regular_user):
        r = await client.post(
            BASE,
            json={
                "user_id": regular_user.id,
                "name": "My Integration Key",
                "scopes": ["tenders:read", "bids:write"],
            },
            headers=admin_token,
        )
        assert r.status_code in (200, 201)
        data = r.json()["data"]
        assert "full_key" in data
        assert data["full_key"].startswith("tiq_")
        assert data["name"] == "My Integration Key"

    async def test_create_key_with_expiry(self, client, admin_token, regular_user):
        r = await client.post(
            BASE,
            json={
                "user_id": regular_user.id,
                "name": "Temp Key",
                "scopes": ["tenders:read"],
                "expires_at": "2027-01-01T00:00:00Z",
            },
            headers=admin_token,
        )
        assert r.status_code in (200, 201)
        assert r.json()["data"]["expires_at"] is not None

    async def test_create_key_full_key_shown_once(self, client, admin_token, regular_user):
        r = await client.post(
            BASE,
            json={"user_id": regular_user.id, "name": "Once Key", "scopes": []},
            headers=admin_token,
        )
        key_id = r.json()["data"]["id"]
        # full_key must NOT appear in list response
        list_r = await client.get(BASE, headers=admin_token)
        items = list_r.json()["data"]
        items_list = items if isinstance(items, list) else items.get("items", [])
        for item in items_list:
            assert "full_key" not in item


class TestAdminAPIKeysToggle:
    async def test_toggle_deactivate(self, client, admin_token, sample_api_key):
        key_obj, _ = sample_api_key
        r = await client.patch(f"{BASE}/{key_obj.id}/toggle", headers=admin_token)
        assert r.status_code == 200
        assert r.json()["data"]["is_active"] is False

    async def test_toggle_reactivate(self, client, admin_token, sample_api_key):
        key_obj, _ = sample_api_key
        await client.patch(f"{BASE}/{key_obj.id}/toggle", headers=admin_token)
        r = await client.patch(f"{BASE}/{key_obj.id}/toggle", headers=admin_token)
        assert r.status_code == 200
        assert r.json()["data"]["is_active"] is True

    async def test_toggle_nonexistent(self, client, admin_token):
        r = await client.patch(f"{BASE}/99999/toggle", headers=admin_token)
        assert r.status_code == 404


class TestAdminAPIKeysDelete:
    async def test_delete_key(self, client, admin_token, sample_api_key):
        key_obj, _ = sample_api_key
        r = await client.delete(f"{BASE}/{key_obj.id}", headers=admin_token)
        assert r.status_code == 200

    async def test_delete_nonexistent(self, client, admin_token):
        r = await client.delete(f"{BASE}/99999", headers=admin_token)
        assert r.status_code == 404
