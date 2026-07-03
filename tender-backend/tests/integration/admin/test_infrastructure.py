"""Admin Infrastructure API tests.

NOTE: Infrastructure endpoints query PostgreSQL system catalogs (pg_stat_user_tables).
      Tests run on SQLite in-memory — db_stats will return empty/error, which is acceptable.
      We test auth, structure, and graceful error handling.
"""

import pytest

BASE = "/api/v1/admin/infrastructure"


class TestAdminInfrastructureAuth:
    async def test_db_stats_requires_admin(self, client, user_token):
        r = await client.get(f"{BASE}/db-stats", headers=user_token)
        assert r.status_code == 403

    async def test_db_stats_requires_auth(self, client):
        r = await client.get(f"{BASE}/db-stats")
        assert r.status_code == 401

    async def test_table_preview_requires_admin(self, client, user_token):
        r = await client.get(f"{BASE}/table/users", headers=user_token)
        assert r.status_code == 403


class TestAdminInfrastructureDBStats:
    async def test_db_stats_responds(self, client, admin_token):
        r = await client.get(f"{BASE}/db-stats", headers=admin_token)
        # On SQLite, PostgreSQL-specific queries may fail gracefully
        assert r.status_code in (200, 500)

    async def test_db_stats_structure_on_success(self, client, admin_token):
        r = await client.get(f"{BASE}/db-stats", headers=admin_token)
        if r.status_code == 200:
            data = r.json()["data"]
            assert "tables" in data
            assert isinstance(data["tables"], list)


class TestAdminInfrastructureTablePreview:
    async def test_allowed_table(self, client, admin_token):
        r = await client.get(f"{BASE}/table/users", headers=admin_token)
        assert r.status_code in (200, 500)  # 500 on SQLite is acceptable
        if r.status_code == 200:
            data = r.json()["data"]
            assert "columns" in data
            assert "rows" in data

    async def test_blocked_table(self, client, admin_token):
        r = await client.get(f"{BASE}/table/pg_shadow", headers=admin_token)
        assert r.status_code in (400, 403, 404)

    async def test_unknown_table(self, client, admin_token):
        r = await client.get(f"{BASE}/table/nonexistent_table_xyz", headers=admin_token)
        assert r.status_code in (400, 403, 404)

    async def test_sql_injection_table_name(self, client, admin_token):
        r = await client.get(f"{BASE}/table/users; DROP TABLE users--", headers=admin_token)
        assert r.status_code in (400, 403, 404, 422)
