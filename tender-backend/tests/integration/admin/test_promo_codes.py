"""Admin Promo Codes API tests."""

import pytest

BASE = "/api/v1/admin/promo-codes"


class TestAdminPromoCodesAuth:
    async def test_requires_admin(self, client, user_token):
        r = await client.get(BASE, headers=user_token)
        assert r.status_code == 403


class TestAdminPromoCodesList:
    async def test_list_empty(self, client, admin_token):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200

    async def test_list_with_codes(self, client, admin_token, sample_promo_codes):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True

    async def test_filter_active(self, client, admin_token, sample_promo_codes):
        r = await client.get(BASE, params={"is_active": True}, headers=admin_token)
        assert r.status_code == 200


class TestAdminPromoCodesCreate:
    async def test_create_percent_code(self, client, admin_token):
        r = await client.post(
            BASE,
            json={
                "code": "TEST20",
                "discount_type": "percent",
                "discount_value": 20.0,
                "plan": "pro",
                "max_uses": 50,
            },
            headers=admin_token,
        )
        assert r.status_code in (200, 201)
        data = r.json()["data"]
        assert data["code"] == "TEST20"
        assert data["discount_value"] == 20.0

    async def test_create_fixed_code(self, client, admin_token):
        r = await client.post(
            BASE,
            json={
                "code": "FIXED100K",
                "discount_type": "fixed",
                "discount_value": 100000.0,
                "plan": "all",
                "max_uses": 10,
            },
            headers=admin_token,
        )
        assert r.status_code in (200, 201)

    async def test_create_duplicate_code(self, client, admin_token, sample_promo_codes):
        r = await client.post(
            BASE,
            json={"code": "SAVE10", "discount_type": "percent", "discount_value": 10.0, "plan": "all", "max_uses": 1},
            headers=admin_token,
        )
        assert r.status_code in (400, 409)


class TestAdminPromoCodesUpdate:
    async def test_toggle_code(self, client, admin_token, sample_promo_codes):
        code_id = sample_promo_codes[0].id
        r = await client.patch(f"{BASE}/{code_id}", json={"is_active": False}, headers=admin_token)
        assert r.status_code == 200
        assert r.json()["data"]["is_active"] is False

    async def test_delete_code(self, client, admin_token, sample_promo_codes):
        code_id = sample_promo_codes[0].id
        r = await client.delete(f"{BASE}/{code_id}", headers=admin_token)
        assert r.status_code == 200

    async def test_validate_code_endpoint(self, client, admin_token, sample_promo_codes):
        r = await client.post(f"{BASE}/validate", json={"code": "SAVE10"}, headers=admin_token)
        assert r.status_code == 200
