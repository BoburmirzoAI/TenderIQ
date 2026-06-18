"""Database backup script with rotation."""

import logging
import os
import subprocess
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BACKUP_DIR = os.environ.get("BACKUP_DIR", "/backups")
MAX_BACKUPS = int(os.environ.get("MAX_BACKUPS", "7"))
DB_URL = os.environ.get("DATABASE_URL", "postgresql://tenderiq:tenderiq@localhost:5432/tenderiq")


def backup() -> None:
    """Create a pg_dump backup and rotate old backups."""
    os.makedirs(BACKUP_DIR, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"tenderiq_{timestamp}.sql.gz"
    filepath = os.path.join(BACKUP_DIR, filename)

    cmd = f"pg_dump {DB_URL} | gzip > {filepath}"
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

    if result.returncode == 0:
        logger.info("Backup created: %s", filepath)
    else:
        logger.error("Backup failed: %s", result.stderr)
        return

    backups = sorted(
        [f for f in os.listdir(BACKUP_DIR) if f.startswith("tenderiq_")],
        reverse=True,
    )
    for old_backup in backups[MAX_BACKUPS:]:
        old_path = os.path.join(BACKUP_DIR, old_backup)
        os.remove(old_path)
        logger.info("Removed old backup: %s", old_backup)


if __name__ == "__main__":
    backup()
