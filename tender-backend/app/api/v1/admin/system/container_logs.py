"""Admin container log viewer — stream Docker container logs via API."""

import asyncio
import json as json_mod
import logging
import os
from datetime import date
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_permission
from app.models.auth.user import User
from app.models.system.log_archive import LogArchive
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_CONTAINERS = {
    "api", "bot", "celery_worker", "celery_beat",
    "postgres", "redis", "pgadmin", "flower",
}

PROJECT_DIR = os.environ.get("COMPOSE_PROJECT_DIR", "/app")


class ContainerInfo(BaseModel):
    name: str
    status: str
    image: str
    ports: str
    created: str
    health: str


async def _run(cmd: list[str], timeout: int = 10) -> tuple[str, str, int]:
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    except asyncio.TimeoutError:
        proc.kill()
        return "", "Timeout", 1
    return stdout.decode(errors="replace"), stderr.decode(errors="replace"), proc.returncode or 0


def _compose_base() -> list[str]:
    return ["docker", "compose", "--project-directory", PROJECT_DIR]


async def _detect_project_name() -> str:
    stdout, _, code = await _run([*_compose_base(), "ls", "--format", "json"])
    if code == 0 and stdout.strip():
        import json
        try:
            projects = json.loads(stdout)
            if projects:
                return projects[0].get("Name", "tender-backend")
        except (json.JSONDecodeError, IndexError, TypeError):
            pass
    return "tender-backend"


@router.get("/containers", response_model=SuccessResponse[list[ContainerInfo]])
async def list_containers(user: User = Depends(require_permission("system.view_logs"))):
    """List all project Docker containers with status."""
    stdout, stderr, code = await _run([
        *_compose_base(), "ps", "--format",
        "{{.Name}}|{{.Status}}|{{.Image}}|{{.Ports}}|{{.CreatedAt}}|{{.Health}}",
    ])
    if code != 0:
        stdout, stderr, code = await _run([
            "docker", "ps", "--filter", "label=com.docker.compose.project",
            "--format", "{{.Names}}|{{.Status}}|{{.Image}}|{{.Ports}}|{{.CreatedAt}}|{{.State}}",
        ])
        if code != 0:
            raise HTTPException(status_code=500, detail=f"Docker buyruqi xato: {stderr[:200]}")

    containers = []
    for line in stdout.strip().splitlines():
        parts = line.split("|")
        if len(parts) >= 3:
            raw_name = parts[0]
            short_name = raw_name
            for sep in ("-", "_"):
                segments = raw_name.rsplit(sep, 1)
                if len(segments) == 2 and segments[1].isdigit():
                    raw_name = segments[0]
                    break
            for prefix in ("tender-backend-", "tender_backend_", "tender-backend_"):
                if raw_name.startswith(prefix):
                    short_name = raw_name[len(prefix):]
                    break
            else:
                short_name = raw_name

            containers.append(ContainerInfo(
                name=short_name,
                status=parts[1] if len(parts) > 1 else "",
                image=parts[2] if len(parts) > 2 else "",
                ports=parts[3] if len(parts) > 3 else "",
                created=parts[4] if len(parts) > 4 else "",
                health=parts[5] if len(parts) > 5 else "",
            ))
    return SuccessResponse(data=containers)


@router.get("/logs/{container}")
async def get_container_logs(
    container: str,
    tail: int = Query(200, ge=10, le=2000),
    user: User = Depends(require_permission("system.view_logs")),
):
    """Get last N lines of a container's logs."""
    base_name = container.replace("tender-backend-", "").replace("tender_backend_", "")
    if base_name not in ALLOWED_CONTAINERS:
        raise HTTPException(status_code=400, detail=f"Noma'lum konteyner: {container}")

    stdout, stderr, code = await _run(
        [*_compose_base(), "logs", base_name, "--tail", str(tail), "--no-color"],
        timeout=15,
    )
    if code != 0:
        full_name = await _find_container_name(base_name)
        stdout, stderr, code = await _run(
            ["docker", "logs", full_name, "--tail", str(tail)],
            timeout=15,
        )
        if code != 0:
            raise HTTPException(status_code=500, detail=f"Loglarni olishda xato: {stderr[:200]}")

    lines = stdout.strip().splitlines() if stdout.strip() else []
    return SuccessResponse(data={"container": base_name, "lines": lines, "count": len(lines)})


@router.get("/logs/{container}/stream")
async def stream_container_logs(
    container: str,
    tail: int = Query(50, ge=10, le=500),
    token: Optional[str] = Query(None),
    user: User = Depends(require_permission("system.view_logs")),
):
    """Stream container logs via Server-Sent Events (real-time)."""
    base_name = container.replace("tender-backend-", "").replace("tender_backend_", "")
    if base_name not in ALLOWED_CONTAINERS:
        raise HTTPException(status_code=400, detail=f"Noma'lum konteyner: {container}")

    compose_cmd = [*_compose_base(), "logs", base_name, "--follow", "--tail", str(tail), "--no-color"]

    async def event_generator():
        proc = await asyncio.create_subprocess_exec(
            *compose_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        try:
            while True:
                try:
                    line = await asyncio.wait_for(proc.stdout.readline(), timeout=30)
                except asyncio.TimeoutError:
                    yield "data: [heartbeat]\n\n"
                    continue
                if not line:
                    yield "data: [stream ended]\n\n"
                    break
                text = line.decode(errors="replace").rstrip()
                yield f"data: {text}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            proc.kill()
            await proc.wait()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def _find_container_name(service: str) -> str:
    stdout, _, code = await _run([
        *_compose_base(), "ps", "--format", "{{.Name}}", service,
    ])
    if code == 0 and stdout.strip():
        return stdout.strip().splitlines()[0]
    return f"tender-backend-{service}-1"


# ── Log Archive Endpoints ────────────────────────────────────────────────────

LOG_DIR = os.environ.get("LOG_ARCHIVE_DIR", "/app/logs/archive")


class ArchiveInfo(BaseModel):
    id: int
    container: str
    log_date: str
    line_count: int
    file_size: int
    level_stats: Optional[dict] = None

    model_config = {"from_attributes": True}


class ArchiveDateSummary(BaseModel):
    log_date: str
    containers: int
    total_lines: int
    total_size: int
    error_count: int


@router.get("/archives")
async def list_archives(
    container: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    user: User = Depends(require_permission("system.view_logs")),
    db: AsyncSession = Depends(get_db),
):
    """List archived log entries grouped by date."""
    query = select(LogArchive).order_by(LogArchive.log_date.desc(), LogArchive.container)

    if container:
        query = query.where(LogArchive.container == container)
    if date_from:
        query = query.where(LogArchive.log_date >= date.fromisoformat(date_from))
    if date_to:
        query = query.where(LogArchive.log_date <= date.fromisoformat(date_to))

    result = await db.execute(query)
    archives = result.scalars().all()

    items = []
    for a in archives:
        level_stats = None
        if a.level_stats:
            try:
                level_stats = json_mod.loads(a.level_stats)
            except (json_mod.JSONDecodeError, TypeError):
                pass
        items.append(ArchiveInfo(
            id=a.id,
            container=a.container,
            log_date=a.log_date.isoformat(),
            line_count=a.line_count,
            file_size=a.file_size,
            level_stats=level_stats,
        ))

    date_groups: dict[str, ArchiveDateSummary] = {}
    for item in items:
        d = item.log_date
        if d not in date_groups:
            date_groups[d] = ArchiveDateSummary(
                log_date=d, containers=0, total_lines=0, total_size=0, error_count=0
            )
        g = date_groups[d]
        g.containers += 1
        g.total_lines += item.line_count
        g.total_size += item.file_size
        if item.level_stats:
            g.error_count += item.level_stats.get("ERROR", 0)

    return SuccessResponse(data={
        "archives": [i.model_dump() for i in items],
        "dates": list(date_groups.values()),
    })


@router.get("/archives/{archive_id}/view")
async def view_archive(
    archive_id: int,
    offset: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=5000),
    search: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    user: User = Depends(require_permission("system.view_logs")),
    db: AsyncSession = Depends(get_db),
):
    """View contents of an archived log file with pagination and filtering."""
    archive = await db.get(LogArchive, archive_id)
    if not archive:
        raise HTTPException(status_code=404, detail="Arxiv topilmadi")

    file_path = Path(archive.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Log fayl topilmadi")

    all_lines = file_path.read_text(encoding="utf-8", errors="replace").splitlines()

    if level:
        import re
        level_upper = level.upper()
        if level_upper == "ERROR":
            all_lines = [l for l in all_lines if re.search(r'\b(ERROR|CRITICAL|FATAL)\b', l, re.IGNORECASE)]
        elif level_upper == "WARNING":
            all_lines = [l for l in all_lines if re.search(r'\bWARNING\b', l, re.IGNORECASE)]
        elif level_upper == "INFO":
            all_lines = [l for l in all_lines if re.search(r'\bINFO\b', l, re.IGNORECASE)]
        elif level_upper == "DEBUG":
            all_lines = [l for l in all_lines if re.search(r'\bDEBUG\b', l, re.IGNORECASE)]

    if search:
        search_lower = search.lower()
        all_lines = [l for l in all_lines if search_lower in l.lower()]

    total = len(all_lines)
    page_lines = all_lines[offset:offset + limit]

    return SuccessResponse(data={
        "container": archive.container,
        "log_date": archive.log_date.isoformat(),
        "total_lines": total,
        "offset": offset,
        "limit": limit,
        "lines": page_lines,
    })


@router.get("/archives/{archive_id}/download")
async def download_archive(
    archive_id: int,
    user: User = Depends(require_permission("system.view_logs")),
    db: AsyncSession = Depends(get_db),
):
    """Download archived log file."""
    archive = await db.get(LogArchive, archive_id)
    if not archive:
        raise HTTPException(status_code=404, detail="Arxiv topilmadi")

    file_path = Path(archive.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Log fayl topilmadi")

    filename = f"{archive.container}_{archive.log_date.isoformat()}.log"
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="text/plain",
    )


@router.post("/archives/collect")
async def trigger_archive(
    target_date: Optional[str] = Query(None),
    user: User = Depends(require_permission("system.view_logs")),
):
    """Manually trigger log archiving for a specific date (default: yesterday)."""
    from app.tasks.system.log_archive_tasks import archive_daily_logs
    task = archive_daily_logs.delay(target_date)
    return SuccessResponse(data={"task_id": task.id, "status": "started", "date": target_date or "yesterday"})
