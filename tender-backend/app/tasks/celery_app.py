"""Celery application instance with beat schedule."""

from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery_app = Celery(
    "tenderiq",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Tashkent",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

celery_app.conf.beat_schedule = {
    # Scraperlar o'chirilgan — faqat qo'lda yoqiladi
    # "scrape-uzex-every-20min": {
    #     "task": "app.tasks.scraping_tasks.scrape_uzex",
    #     "schedule": crontab(minute="*/20"),
    # },
    # "scrape-mc-hourly": {
    #     "task": "app.tasks.scraping_tasks.scrape_mc",
    #     "schedule": crontab(minute=5),
    # },
    "retrain-price-model-daily": {
        "task": "app.tasks.ml_tasks.retrain_price_model",
        "schedule": crontab(hour=3, minute=0),
    },
    "send-daily-digest": {
        "task": "app.tasks.notification_tasks.send_daily_digest_all",
        "schedule": crontab(hour=8, minute=0),
    },
    "send-deadline-reminders": {
        "task": "app.tasks.notification_tasks.send_deadline_reminders",
        "schedule": crontab(hour=9, minute=0),
    },
    "cleanup-notifications": {
        "task": "app.tasks.cleanup_tasks.cleanup_old_notifications",
        "schedule": crontab(hour=2, minute=0, day_of_week=1),
    },
    "evaluate-model-drift": {
        "task": "app.tasks.ml_tasks.evaluate_model_drift",
        "schedule": crontab(hour=4, minute=0),
    },
    "backup-check": {
        "task": "app.tasks.cleanup_tasks.verify_backup",
        "schedule": crontab(hour=6, minute=0),
    },
    "archive-daily-logs": {
        "task": "app.tasks.log_archive_tasks.archive_daily_logs",
        "schedule": crontab(hour=0, minute=30),
    },
}

celery_app.autodiscover_tasks(
    [
        "app.tasks.scraping.scraping_tasks",
        "app.tasks.ml.matching_tasks",
        "app.tasks.ml.ml_tasks",
        "app.tasks.communication.notification_tasks",
        "app.tasks.system.report_tasks",
        "app.tasks.system.cleanup_tasks",
        "app.tasks.system.log_archive_tasks",
    ]
)
