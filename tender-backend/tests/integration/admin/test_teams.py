"""Admin Teams API tests."""

import pytest

BASE = "/api/v1/admin/teams"


class TestAdminTeamsAuth:
    async def test_requires_admin(self, client, user_token):
        r = await client.get(BASE, headers=user_token)
        assert r.status_code == 403


class TestAdminTeamsList:
    async def test_list_empty(self, client, admin_token):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200

    async def test_list_with_data(self, client, admin_token, sample_team):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_get_team_by_id(self, client, admin_token, sample_team):
        r = await client.get(f"{BASE}/{sample_team.id}", headers=admin_token)
        assert r.status_code == 200
        assert r.json()["data"]["id"] == sample_team.id

    async def test_get_nonexistent_team(self, client, admin_token):
        r = await client.get(f"{BASE}/99999", headers=admin_token)
        assert r.status_code == 404

    async def test_team_members(self, client, admin_token, sample_team):
        r = await client.get(f"{BASE}/{sample_team.id}/members", headers=admin_token)
        assert r.status_code == 200
        members = r.json()["data"]
        assert isinstance(members, list)
        assert len(members) >= 1


class TestAdminTeamsUpdate:
    async def test_update_team_name(self, client, admin_token, sample_team):
        r = await client.patch(
            f"{BASE}/{sample_team.id}",
            json={"name": "Beta Team"},
            headers=admin_token,
        )
        assert r.status_code == 200
        assert r.json()["data"]["name"] == "Beta Team"

    async def test_delete_team(self, client, admin_token, sample_team):
        r = await client.delete(f"{BASE}/{sample_team.id}", headers=admin_token)
        assert r.status_code == 200
