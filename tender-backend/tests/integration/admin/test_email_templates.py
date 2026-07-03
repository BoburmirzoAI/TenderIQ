"""Admin Email Templates API tests."""

import pytest

BASE = "/api/v1/admin/email-templates"


class TestAdminEmailTemplatesAuth:
    async def test_requires_admin(self, client, user_token):
        r = await client.get(BASE, headers=user_token)
        assert r.status_code == 403


class TestAdminEmailTemplatesList:
    async def test_list_empty(self, client, admin_token):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200

    async def test_list_with_templates(self, client, admin_token, sample_email_templates):
        r = await client.get(BASE, headers=admin_token)
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True

    async def test_get_by_slug(self, client, admin_token, sample_email_templates):
        r = await client.get(f"{BASE}/welcome", headers=admin_token)
        assert r.status_code == 200
        assert r.json()["data"]["slug"] == "welcome"

    async def test_get_nonexistent_slug(self, client, admin_token):
        r = await client.get(f"{BASE}/nonexistent-slug", headers=admin_token)
        assert r.status_code == 404


class TestAdminEmailTemplatesUpdate:
    async def test_update_subject(self, client, admin_token, sample_email_templates):
        r = await client.patch(
            f"{BASE}/welcome",
            json={"subject": "Yangilangan xush kelibsiz!"},
            headers=admin_token,
        )
        assert r.status_code == 200
        assert r.json()["data"]["subject"] == "Yangilangan xush kelibsiz!"

    async def test_update_body(self, client, admin_token, sample_email_templates):
        r = await client.patch(
            f"{BASE}/welcome",
            json={"body_html": "<p>Yangi kontent</p>"},
            headers=admin_token,
        )
        assert r.status_code == 200

    async def test_preview_template(self, client, admin_token, sample_email_templates):
        r = await client.post(
            f"{BASE}/welcome/preview",
            json={"full_name": "Test Foydalanuvchi"},
            headers=admin_token,
        )
        assert r.status_code == 200
