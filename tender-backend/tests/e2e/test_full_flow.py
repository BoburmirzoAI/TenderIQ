"""End-to-end test for the full user flow."""

import pytest


class TestFullFlow:
    """Test: register → create company → match tenders → check."""

    async def test_register_create_company_flow(self, client, test_tenders):
        reg_resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "flow@example.com",
                "password": "flowpassword123",
                "full_name": "Flow User",
            },
        )
        assert reg_resp.status_code == 200
        token = reg_resp.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        company_resp = await client.post(
            "/api/v1/companies/",
            json={
                "name": "Flow Company",
                "categories": ["construction", "it"],
                "regions": ["tashkent_city"],
                "min_amount": 10000000,
                "max_amount": 500000000,
            },
            headers=headers,
        )
        assert company_resp.status_code == 200

        profile_resp = await client.get("/api/v1/companies/me", headers=headers)
        assert profile_resp.status_code == 200
        assert profile_resp.json()["data"]["name"] == "Flow Company"

        sub_resp = await client.get("/api/v1/subscriptions/current", headers=headers)
        assert sub_resp.status_code == 200
        assert sub_resp.json()["data"]["plan"] == "free"

        tenders_resp = await client.get("/api/v1/tenders/", headers=headers)
        assert tenders_resp.status_code == 200
        assert len(tenders_resp.json()["data"]) > 0
