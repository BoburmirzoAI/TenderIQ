"""Integration tests for tender API."""

import pytest


class TestTenderAPI:
    """Test tender listing and search endpoints."""

    async def test_list_tenders(self, client, test_tenders):
        response = await client.get("/api/v1/tenders/")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) > 0
        assert "total" in data

    async def test_list_tenders_with_category_filter(self, client, test_tenders):
        response = await client.get("/api/v1/tenders/?category=construction")
        assert response.status_code == 200
        data = response.json()
        for tender in data["data"]:
            assert tender["category"] == "construction"

    async def test_list_tenders_pagination(self, client, test_tenders):
        response = await client.get("/api/v1/tenders/?page=1&per_page=3")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) <= 3
        assert data["per_page"] == 3

    async def test_get_tender_detail(self, client, test_tenders):
        tender = test_tenders[0]
        response = await client.get(f"/api/v1/tenders/{tender.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["id"] == tender.id

    async def test_get_nonexistent_tender(self, client):
        response = await client.get("/api/v1/tenders/99999")
        assert response.status_code == 404
