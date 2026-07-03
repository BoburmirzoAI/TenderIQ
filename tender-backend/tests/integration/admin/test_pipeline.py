"""Admin Pipeline (TenderApplication) API tests."""

import pytest

BASE = "/api/v1/admin/pipeline"


class TestAdminPipelineAuth:
    async def test_requires_admin(self, client, user_token):
        r = await client.get(BASE, headers=user_token)
        assert r.status_code == 403


class TestAdminPipelineList:
    async def test_list_empty(self, client, admin_token):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_list_with_data(self, client, admin_token, sample_pipeline):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_by_stage(self, client, admin_token, sample_pipeline):
        r = await client.get(BASE, params={"stage": "discovered"}, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_by_user(self, client, admin_token, regular_user, sample_pipeline):
        r = await client.get(BASE, params={"user_id": regular_user.id}, headers=admin_token)
        assert r.status_code == 200

    async def test_stats_endpoint(self, client, admin_token, sample_pipeline):
        r = await client.get(f"{BASE}/stats", headers=admin_token)
        assert r.status_code == 200
        data = r.json()["data"]
        assert isinstance(data, dict)

    async def test_stages_breakdown(self, client, admin_token, sample_pipeline):
        r = await client.get(f"{BASE}/stats", headers=admin_token)
        assert r.status_code == 200


class TestAdminPipelineUpdate:
    async def test_update_stage(self, client, admin_token, sample_pipeline):
        app_id = sample_pipeline[0].id
        r = await client.patch(
            f"{BASE}/{app_id}",
            json={"stage": "submitted"},
            headers=admin_token,
        )
        assert r.status_code == 200

    async def test_update_bid_amount(self, client, admin_token, sample_pipeline):
        app_id = sample_pipeline[0].id
        r = await client.patch(
            f"{BASE}/{app_id}",
            json={"bid_amount": 250000000.0},
            headers=admin_token,
        )
        assert r.status_code == 200
