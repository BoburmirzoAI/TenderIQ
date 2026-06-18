"""Celery tasks for database and cache cleanup."""

import asyncio
import logging

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="app.tasks.cleanup_tasks.cleanup_old_notifications")
def cleanup_old_notifications():
    """Remove notifications older than 30 days."""

    async def _cleanup():
        from datetime import datetime, timedelta, timezone

        from sqlalchemy import delete

        from app.database import async_session
        from app.models.notification import Notification

        cutoff = datetime.now(timezone.utc) - timedelta(days=30)

        async with async_session() as session:
            result = await session.execute(
                delete(Notification).where(
                    Notification.created_at < cutoff,
                    Notification.is_read.is_(True),
                )
            )
            await session.commit()
            return result.rowcount

    count = _run_async(_cleanup())
    logger.info("Cleaned up %d old notifications", count)
    return {"deleted": count}


@celery_app.task(name="app.tasks.cleanup_tasks.cleanup_expired_cache")
def cleanup_expired_cache():
    """Clean up expired cache entries."""
    logger.info("Cache cleanup triggered (Redis handles TTL automatically)")
    return {"status": "ok"}


@celery_app.task(name="app.tasks.cleanup_tasks.verify_backup")
def verify_backup():
    """Verify that database backups are running."""
    import os
    from datetime import datetime, timedelta

    backup_dir = "/backups"
    if not os.path.exists(backup_dir):
        logger.warning("Backup directory not found: %s", backup_dir)
        return {"status": "warning", "message": "Backup directory not found"}

    files = os.listdir(backup_dir)
    if not files:
        logger.warning("No backup files found")
        return {"status": "warning", "message": "No backup files"}

    latest = max(files, key=lambda f: os.path.getmtime(os.path.join(backup_dir, f)))
    latest_time = datetime.fromtimestamp(os.path.getmtime(os.path.join(backup_dir, latest)))

    is_recent = datetime.now() - latest_time < timedelta(hours=25)

    logger.info("Latest backup: %s (%s)", latest, latest_time)
    return {
        "status": "ok" if is_recent else "warning",
        "latest_backup": latest,
        "backup_time": str(latest_time),
    }
