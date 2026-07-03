"""Admin Saved Searches API tests."""

import pytest

BASE = "/api/v1/admin/saved-searches"


class TestAdminSavedSearchesAuth:
    async def test_requires_admin(self, client, user_token):
        r = await client.get(BASE, headers=user_token)
        assert r.status_code == 403


class TestAdminSavedSearchesList:
    async def test_list_empty(self, client, admin_token):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200

    async def test_list_with_data(self, client, admin_token, sample_saved_searches):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_filter_by_user(self, client, admin_token, regular_user, sample_saved_searches):
        r = await client.get(BASE, params={"user_id": regular_user.id}, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_notify_only(self, client, admin_token, sample_saved_searches):
        r = await client.get(BASE, params={"notify": True}, headers=admin_token)
        assert r.status_code == 200


class TestAdminSavedSearchesDelete:
    async def test_delete_search(self, client, admin_token, sample_saved_searches):
        sid = sample_saved_searches[0].id
        r = await client.delete(f"{BASE}/{sid}", headers=admin_token)
        assert r.status_code == 200

    async def test_delete_nonexistent(self, client, admin_token):
        r = await client.delete(f"{BASE}/99999", headers=admin_token)
        assert r.status_code == 404
