"""Admin infrastructure — DB table stats, export, and SQL console."""

import csv
import io
import logging
import re
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_superadmin, require_admin
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class TableStat(BaseModel):
    name: str
    row_count: int
    size_pretty: str
    size_bytes: int


class DBOverview(BaseModel):
    db_name: str
    total_size_pretty: str
    table_count: int
    tables: List[TableStat]


@router.get("/db-stats", response_model=SuccessResponse[DBOverview])
async def db_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Real PostgreSQL table sizes and row counts."""
    try:
        rows = (await db.execute(text("""
            SELECT
                relname AS name,
                pg_size_pretty(pg_total_relation_size(quote_ident(relname))) AS size_pretty,
                pg_total_relation_size(quote_ident(relname)) AS size_bytes
            FROM pg_stat_user_tables
            ORDER BY size_bytes DESC
        """))).fetchall()

        db_name_row = (await db.execute(text("SELECT current_database()"))).scalar()
        total_size_row = (await db.execute(text("SELECT pg_size_pretty(pg_database_size(current_database()))"))).scalar()
    except Exception as e:
        logger.warning("db_stats query failed (non-PostgreSQL?): %s", e)
        await db.rollback()
        return SuccessResponse(data=DBOverview(
            db_name="unknown",
            total_size_pretty="N/A",
            table_count=0,
            tables=[],
        ))

    tables = []
    for r in rows:
        try:
            count_result = await db.execute(text(f'SELECT COUNT(*) FROM "{r.name}"'))
            row_count = count_result.scalar() or 0
        except Exception:
            row_count = 0
        tables.append(TableStat(name=r.name, row_count=row_count, size_pretty=r.size_pretty, size_bytes=r.size_bytes))
    return SuccessResponse(data=DBOverview(
        db_name=db_name_row or "tenderiq",
        total_size_pretty=total_size_row or "0 MB",
        table_count=len(tables),
        tables=tables,
    ))


@router.get("/table/{table_name}", response_model=SuccessResponse[Dict[str, Any]])
async def table_preview(
    table_name: str,
    limit: int = Query(10, ge=1, le=50),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Preview first N rows of a table (admin only, safe list)."""
    ALLOWED = {
        "users", "tenders", "companies", "payments", "subscriptions",
        "notifications", "tender_matches", "saved_searches", "audit_logs",
        "email_templates", "promo_codes", "teams", "team_members", "bids",
        "tender_results", "tender_applications", "document_checks", "api_keys",
        "api_permissions", "purchase_plans", "contracts", "tender_notes",
        "kb_categories", "kb_articles", "news", "support_tickets", "log_archives",
        "bot_groups", "company_ratings", "contact_requests", "document_comments",
        "faqs", "permissions", "roles", "ticket_messages", "user_interests",
    }
    if table_name not in ALLOWED:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Bu jadval ko'rib bo'lmaydi")

    from sqlalchemy import text as sql_text

    TABLES_WITH_USER_EMAIL = {
        "subscriptions", "payments", "notifications", "saved_searches",
        "audit_logs", "tender_applications", "bids", "user_interests",
        "ticket_messages", "contact_requests", "document_comments", "tender_notes",
    }

    safe_table = table_name.replace('"', '')

    has_id = (await db.execute(sql_text(
        "SELECT 1 FROM information_schema.columns "
        "WHERE table_name = :tbl AND column_name = 'id' AND table_schema = 'public'"
    ), {"tbl": safe_table})).scalar() is not None

    order_clause = "ORDER BY id DESC" if has_id else ""

    has_user_id = table_name in TABLES_WITH_USER_EMAIL

    if has_user_id:
        query = sql_text(
            f'SELECT t.*, u.email AS user_email FROM "{safe_table}" t '
            f'LEFT JOIN users u ON u.id = t.user_id '
            f'{("ORDER BY t.id DESC" if has_id else "")} LIMIT :lim'
        )
    else:
        query = sql_text(f'SELECT * FROM "{safe_table}" {order_clause} LIMIT :lim')

    rows = (await db.execute(query, {"lim": limit})).fetchall()
    if not rows:
        return SuccessResponse(data={"columns": [], "rows": []})

    raw_columns = list(rows[0]._fields)

    priority = ["id", "user_id", "user_email", "name", "email", "title"]
    ordered = [c for c in priority if c in raw_columns]
    ordered += [c for c in raw_columns if c not in ordered]

    col_indices = [raw_columns.index(c) for c in ordered]
    data_rows = [[str(rows[r][i]) if rows[r][i] is not None else "" for i in col_indices] for r in range(len(rows))]

    return SuccessResponse(data={"columns": ordered, "rows": data_rows, "table": table_name})


ALLOWED_TABLES = {
    "users", "tenders", "companies", "payments", "subscriptions",
    "notifications", "tender_matches", "saved_searches", "audit_logs",
    "email_templates", "promo_codes", "teams", "team_members", "bids",
    "tender_results", "tender_applications", "document_checks", "api_keys",
    "api_permissions", "purchase_plans", "contracts", "tender_notes",
    "kb_categories", "kb_articles", "news", "support_tickets", "log_archives",
    "bot_groups", "company_ratings", "contact_requests", "document_comments",
    "faqs", "permissions", "roles", "ticket_messages", "user_interests",
}


@router.get("/export/{table_name}")
async def export_table_csv(
    table_name: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Export a single table as CSV."""
    safe = table_name.replace('"', '')
    if safe not in ALLOWED_TABLES:
        raise HTTPException(status_code=403, detail="Bu jadval eksport qilib bo'lmaydi")

    rows = (await db.execute(text(f'SELECT * FROM "{safe}"'))).fetchall()

    buf = io.StringIO()
    writer = csv.writer(buf)
    if rows:
        writer.writerow(list(rows[0]._fields))
        for row in rows:
            writer.writerow([str(v) if v is not None else "" for v in row])

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{safe}.csv"'},
    )


@router.get("/export-all")
async def export_all_csv(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Export all tables as a single CSV (separated by headers)."""
    table_names = (await db.execute(text(
        "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    ))).fetchall()

    buf = io.StringIO()
    writer = csv.writer(buf)

    for (tbl,) in table_names:
        writer.writerow([])
        writer.writerow([f"=== {tbl} ==="])
        try:
            rows = (await db.execute(text(f'SELECT * FROM "{tbl}"'))).fetchall()
            if rows:
                writer.writerow(list(rows[0]._fields))
                for row in rows:
                    writer.writerow([str(v) if v is not None else "" for v in row])
            else:
                writer.writerow(["(bo'sh jadval)"])
        except Exception:
            writer.writerow(["(o'qib bo'lmadi)"])

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="tenderiq_full_export.csv"'},
    )


FORBIDDEN_SQL = re.compile(
    r'\b(DROP|TRUNCATE|DELETE|UPDATE|INSERT|ALTER|CREATE|GRANT|REVOKE|COPY)\b',
    re.IGNORECASE,
)


@router.post("/query", response_model=SuccessResponse[Dict[str, Any]])
async def run_sql_query(
    body: Dict[str, Any],
    admin: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    """Execute a read-only SQL query (superadmin only)."""
    sql = body.get("sql", "").strip()
    if not sql:
        raise HTTPException(status_code=400, detail="SQL so'rov bo'sh")

    if FORBIDDEN_SQL.search(sql):
        raise HTTPException(status_code=403, detail="Faqat SELECT so'rovlarga ruxsat berilgan")

    if not sql.upper().startswith("SELECT") and not sql.upper().startswith("WITH"):
        raise HTTPException(status_code=403, detail="Faqat SELECT/WITH so'rovlarga ruxsat berilgan")

    limit_match = re.search(r'\bLIMIT\s+(\d+)', sql, re.IGNORECASE)
    if not limit_match:
        sql = sql.rstrip(";") + " LIMIT 500"
    elif int(limit_match.group(1)) > 500:
        raise HTTPException(status_code=400, detail="LIMIT 500 dan oshmasligi kerak")

    try:
        result = await db.execute(text(sql))
        rows = result.fetchall()
        if not rows:
            return SuccessResponse(data={"columns": [], "rows": [], "count": 0})

        columns = list(rows[0]._fields)
        data_rows = [[str(v) if v is not None else "NULL" for v in row] for row in rows]
        return SuccessResponse(data={"columns": columns, "rows": data_rows, "count": len(data_rows)})
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"SQL xato: {str(e)[:300]}")
