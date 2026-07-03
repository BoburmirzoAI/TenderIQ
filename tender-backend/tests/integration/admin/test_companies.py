"""Admin Companies API tests."""

import pytest

BASE = "/api/v1/admin/companies"


class TestAdminCompaniesAuth:
    async def test_requires_admin(self, client, user_token):
        r = await client.get(BASE, headers=user_token)
        assert r.status_code == 403

    async def test_requires_auth(self, client):
        r = await client.get(BASE)
        assert r.status_code == 401


class TestAdminCompaniesList:
    async def test_list_empty(self, client, admin_token):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_list_with_data(self, client, admin_token, sample_company):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True

    async def test_search_by_name(self, client, admin_token, sample_company):
        r = await client.get(BASE, params={"search": "Sample Company"}, headers=admin_token)
        assert r.status_code == 200

    async def test_search_by_stir(self, client, admin_token, sample_company):
        r = await client.get(BASE, params={"search": "123456789"}, headers=admin_token)
        assert r.status_code == 200

    async def test_pagination(self, client, admin_token, sample_company):
        r = await client.get(BASE, params={"page": 1, "page_size": 5}, headers=admin_token)
        assert r.status_code == 200


class TestAdminCompanyDetail:
    async def test_get_by_id(self, client, admin_token, sample_company):
        r = await client.get(f"{BASE}/{sample_company.id}", headers=admin_token)
        assert r.status_code == 200
        assert r.json()["data"]["id"] == sample_company.id

    async def test_get_nonexistent(self, client, admin_token):
        r = await client.get(f"{BASE}/99999", headers=admin_token)
        assert r.status_code == 404


class TestAdminCompanyUpdate:
    async def test_update_name(self, client, admin_token, sample_company):
        r = await client.patch(
            f"{BASE}/{sample_company.id}",
            json={"name": "Renamed Company LLC"},
            headers=admin_token,
        )
        assert r.status_code == 200
        assert r.json()["data"]["name"] == "Renamed Company LLC"

    async def test_delete_company(self, client, admin_token, sample_company):
        r = await client.delete(f"{BASE}/{sample_company.id}", headers=admin_token)
        assert r.status_code == 200
