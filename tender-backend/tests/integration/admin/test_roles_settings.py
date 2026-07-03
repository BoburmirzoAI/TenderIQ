"""Admin Roles, Settings, Integrations API tests."""

import pytest

ROLES = "/api/v1/admin/roles"
SETTINGS = "/api/v1/admin/settings"
INTEGRATIONS = "/api/v1/admin/integrations"


class TestAdminRoles:
    async def test_roles_requires_admin(self, client, user_token):
        r = await client.get(ROLES, headers=user_token)
        assert r.status_code == 403

    async def test_list_roles(self, client, admin_token):
        r = await client.get(ROLES, headers=admin_token)
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_permissions_list(self, client, admin_token):
        r = await client.get(f"{ROLES}/permissions", headers=admin_token)
        assert r.status_code == 200

    async def test_assign_role_to_user(self, client, admin_token, regular_user):
        r = await client.put(
            f"{ROLES}/users/{regular_user.id}/roles",
            json={"role_ids": []},
            headers=admin_token,
        )
        assert r.status_code in (200, 201, 422)


class TestAdminSettings:
    async def test_settings_requires_admin(self, client, user_token):
        r = await client.get(f"{SETTINGS}/flags", headers=user_token)
        assert r.status_code == 403

    async def test_get_settings(self, client, admin_token):
        r = await client.get(f"{SETTINGS}/flags", headers=admin_token)
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_update_setting(self, client, admin_token):
        r = await client.patch(
            f"{SETTINGS}/flags/maintenance_mode",
            json={"value": False},
            headers=admin_token,
        )
        assert r.status_code in (200, 404)

    async def test_get_config(self, client, admin_token):
        r = await client.get(f"{SETTINGS}/config", headers=admin_token)
        assert r.status_code == 200


class TestAdminIntegrations:
    async def test_integrations_requires_admin(self, client, user_token):
        r = await client.get(f"{INTEGRATIONS}/celery/stats", headers=user_token)
        assert r.status_code == 403

    async def test_list_integrations(self, client, admin_token):
        r = await client.get(f"{INTEGRATIONS}/celery/stats", headers=admin_token)
        assert r.status_code == 200

    async def test_integration_status(self, client, admin_token):
        r = await client.get(f"{INTEGRATIONS}/scrapers", headers=admin_token)
        assert r.status_code == 200
