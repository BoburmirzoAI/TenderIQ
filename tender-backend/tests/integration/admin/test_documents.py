"""Admin Documents API tests."""

import pytest

BASE = "/api/v1/admin/documents"


class TestAdminDocumentsAuth:
    async def test_requires_admin(self, client, user_token):
        r = await client.get(BASE, headers=user_token)
        assert r.status_code == 403

    async def test_requires_auth(self, client):
        r = await client.get(BASE)
        assert r.status_code == 401


class TestAdminDocumentsList:
    async def test_list_empty(self, client, admin_token):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        assert r.json()["success"] is True

    async def test_list_with_data(self, client, admin_token, sample_document_check):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_by_status(self, client, admin_token, sample_document_check):
        r = await client.get(BASE, params={"status": "checked"}, headers=admin_token)
        assert r.status_code == 200

    async def test_filter_by_user(self, client, admin_token, regular_user, sample_document_check):
        r = await client.get(BASE, params={"user_id": regular_user.id}, headers=admin_token)
        assert r.status_code == 200

    async def test_stats_endpoint(self, client, admin_token, sample_document_check):
        r = await client.get(f"{BASE}/stats", headers=admin_token)
        assert r.status_code == 200
        data = r.json()["data"]
        assert "total_checks" in data
        assert "avg_compliance" in data
        assert "total_issues" in data


class TestAdminDocumentsCreate:
    async def test_create_document_check(self, client, admin_token, regular_user):
        r = await client.post(
            BASE,
            json={
                "user_id": regular_user.id,
                "filename": "new_doc.pdf",
                "file_type": "pdf",
                "file_size_kb": 256,
                "tender_name": "Test Tender",
                "compliance_score": 90.0,
                "issues_count": 1,
                "checklist": [{"name": "Imzo", "status": "pass"}],
                "missing_items": [],
                "status": "checked",
            },
            headers=admin_token,
        )
        assert r.status_code in (200, 201)

    async def test_create_minimal(self, client, admin_token):
        r = await client.post(
            BASE,
            json={
                "filename": "minimal.pdf",
                "compliance_score": 75.0,
                "issues_count": 3,
                "checklist": [],
                "missing_items": ["Litsenziya"],
                "status": "checked",
            },
            headers=admin_token,
        )
        assert r.status_code in (200, 201)


class TestAdminDocumentsDelete:
    async def test_delete_document(self, client, admin_token, sample_document_check):
        r = await client.delete(f"{BASE}/{sample_document_check.id}", headers=admin_token)
        assert r.status_code == 200

    async def test_delete_nonexistent(self, client, admin_token):
        r = await client.delete(f"{BASE}/99999", headers=admin_token)
        assert r.status_code == 404
