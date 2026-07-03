"""Daily container log archiving task."""

import asyncio
import json
import logging
import os
import re
import subprocess
from datetime import date, timedelta
from pathlib import Path

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

CONTAINERS = ["api", "bot", "celery_worker", "celery_beat", "postgres", "redis", "pgadmin", "flower"]
LOG_DIR = os.environ.get("LOG_ARCHIVE_DIR", "/app/logs/archive")
PROJECT_DIR = os.environ.get("COMPOSE_PROJECT_DIR", "/app")


def _count_levels(lines: list[str]) -> dict:
    stats = {"ERROR": 0, "WARNING": 0, "INFO": 0, "DEBUG": 0, "OTHER": 0}
    for line in lines:
        if re.search(r'\b(ERROR|CRITICAL|FATAL)\b', line, re.IGNORECASE):
            stats["ERROR"] += 1
        elif re.search(r'\bWARNING\b', line, re.IGNORECASE):
            stats["WARNING"] += 1
        elif re.search(r'\bINFO\b', line, re.IGNORECASE):
            stats["INFO"] += 1
        elif re.search(r'\bDEBUG\b', line, re.IGNORECASE):
            stats["DEBUG"] += 1
        else:
            stats["OTHER"] += 1
    return stats


@celery_app.task(name="app.tasks.log_archive_tasks.archive_daily_logs")
def archive_daily_logs(target_date: str | None = None):
    """Collect yesterday's logs from all containers and save to files."""
    log_date = date.fromisoformat(target_date) if target_date else date.today() - timedelta(days=1)
    date_str = log_date.isoformat()
    day_dir = Path(LOG_DIR) / date_str
    day_dir.mkdir(parents=True, exist_ok=True)

    results = []
    for container in CONTAINERS:
        try:
            result = subprocess.run(
                [
                    "docker", "compose", "--project-directory", PROJECT_DIR,
                    "logs", container, "--no-color",
                    "--since", f"{date_str}T00:00:00",
                    "--until", f"{date_str}T23:59:59",
                ],
                capture_output=True, text=True, timeout=30,
            )
            raw = result.stdout.strip()
            if not raw and result.returncode != 0:
                full_name = f"tender-backend-{container}-1"
                result = subprocess.run(
                    ["docker", "logs", full_name, "--since", f"{date_str}T00:00:00", "--until", f"{date_str}T23:59:59"],
                    capture_output=True, text=True, timeout=30,
                )
                raw = result.stdout.strip()

            if not raw:
                results.append({"container": container, "lines": 0, "skipped": True})
                continue

            lines = raw.splitlines()
            formatted = _format_lines(lines, container)

            file_path = day_dir / f"{container}.log"
            file_path.write_text("\n".join(formatted), encoding="utf-8")

            level_stats = _count_levels(formatted)
            file_size = file_path.stat().st_size

            asyncio.run(
                _save_metadata(container, log_date, str(file_path), len(formatted), file_size, level_stats)
            )

            results.append({
                "container": container,
                "lines": len(formatted),
                "size": file_size,
                "levels": level_stats,
            })
            logger.info("Archived %d lines for %s on %s", len(formatted), container, date_str)

        except subprocess.TimeoutExpired:
            logger.warning("Timeout collecting logs for %s", container)
            results.append({"container": container, "error": "timeout"})
        except Exception as e:
            logger.error("Failed to archive %s: %s", container, str(e))
            results.append({"container": container, "error": str(e)})

    return {"date": date_str, "containers": results}


def _format_lines(lines: list[str], container: str) -> list[str]:
    """Clean and format log lines — remove container prefix duplicates."""
    formatted = []
    prefix_pattern = re.compile(rf'^{re.escape(container)}\s*\|\s*', re.IGNORECASE)
    alt_prefix = re.compile(r'^tender-backend-\S+\s*\|\s*')

    for line in lines:
        line = prefix_pattern.sub("", line)
        line = alt_prefix.sub("", line)
        line = line.rstrip()
        if line:
            formatted.append(line)
    return formatted


async def _save_metadata(container: str, log_date: date, file_path: str, line_count: int, file_size: int, level_stats: dict):
    from sqlalchemy import select

    from app.database import async_session
    from app.models.system.log_archive import LogArchive

    async with async_session() as session:
        result = await session.execute(
            select(LogArchive).where(
                LogArchive.container == container,
                LogArchive.log_date == log_date,
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.file_path = file_path
            existing.line_count = line_count
            existing.file_size = file_size
            existing.level_stats = json.dumps(level_stats)
        else:
            session.add(LogArchive(
                container=container,
                log_date=log_date,
                file_path=file_path,
                line_count=line_count,
                file_size=file_size,
                level_stats=json.dumps(level_stats),
            ))
        await session.commit()
