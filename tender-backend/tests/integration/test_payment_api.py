"""Integration tests for payment API."""

import pytest


class TestPaymentAPI:
    """Test payment endpoints."""

    async def test_create_payment(self, client, test_user, test_subscription, auth_headers):
        response = await client.post(
            "/api/v1/payments/create",
            json={"plan": "pro", "provider": "click"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["amount"] == 299_000
        assert "payment_url" in data["data"]

    async def test_create_payment_free_plan(self, client, test_user, test_subscription, auth_headers):
        response = await client.post(
            "/api/v1/payments/create",
            json={"plan": "free", "provider": "click"},
            headers=auth_headers,
        )
        assert response.status_code == 422

    async def test_payment_history_empty(self, client, test_user, auth_headers):
        response = await client.get(
            "/api/v1/payments/history",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["data"] == []
