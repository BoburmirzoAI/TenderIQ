"""Admin integrations — Celery, scrapers, ML models, Telegram bot, connection tests."""

import logging
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import require_admin
from app.models.communication.bot_group import BotGroup
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class CeleryStats(BaseModel):
    workers: int
    active_tasks: int
    reserved_tasks: int
    scheduled_tasks: int
    worker_names: List[str]


class BeatTask(BaseModel):
    name: str
    task: str
    schedule: str
    description: str
    enabled: bool = True


class TriggerResponse(BaseModel):
    task_name: str
    task_id: str
    status: str


class ScheduleUpdate(BaseModel):
    cron: str


class ScraperStatus(BaseModel):
    name: str
    task_name: str
    status: str
    last_result: Optional[Dict[str, Any]] = None


class MLModelInfo(BaseModel):
    name: str
    task_name: str
    status: str


class BotInfo(BaseModel):
    username: str
    registered_users: int
    active_groups: int
    webhook_url: str
    token_masked: str


class BotBroadcastRequest(BaseModel):
    message: str


class ConnectionTestRequest(BaseModel):
    service: str


class ConnectionTestResult(BaseModel):
    service: str
    status: str
    latency_ms: Optional[float] = None
    detail: Optional[str] = None


# ── Celery helpers ────────────────────────────────────────────────────────────

def _crontab_to_str(schedule) -> str:
    """Convert celery crontab object to cron string."""
    try:
        m = getattr(schedule, '_orig_minute', '*')
        h = getattr(schedule, '_orig_hour', '*')
        d = getattr(schedule, '_orig_day_of_week', '*')
        dom = getattr(schedule, '_orig_day_of_month', '*')
        mon = getattr(schedule, '_orig_month_of_year', '*')
        return f"{m} {h} {dom} {mon} {d}"
    except Exception:
        return str(schedule)


BEAT_DESCRIPTIONS: Dict[str, str] = {
    "scrape-uzex-every-20min":    "UZEX scraperini ishga tushirish",
    "scrape-mc-hourly":           "MC.uz scraperini ishga tushirish",
    "retrain-price-model-daily":  "ML narx modelini qayta o'qitish",
    "send-daily-digest":          "Kunlik tender digest yuborish",
    "send-deadline-reminders":    "Deadline eslatmalarini yuborish",
    "cleanup-notifications":      "Eski bildirishnomalarni tozalash",
    "evaluate-model-drift":       "ML model drift baholash",
    "backup-check":               "DB backup tekshirish",
}

SCRAPER_MAP = {
    "UZEX":  "app.tasks.scraping_tasks.scrape_uzex",
    "MC":    "app.tasks.scraping_tasks.scrape_mc",
    "MyGov": "app.tasks.scraping_tasks.scrape_mygov",
}

ML_MODEL_MAP = {
    "PriceModel":           "app.tasks.ml_tasks.retrain_price_model",
    "MatchingModel":        "app.tasks.matching_tasks.run_all_matches",
    "ModelDriftEvaluator":  "app.tasks.ml_tasks.evaluate_model_drift",
}


# ── Celery endpoints ──────────────────────────────────────────────────────────

@router.get("/celery/stats", response_model=SuccessResponse[CeleryStats])
async def celery_stats(admin: User = Depends(require_admin)):
    """Real-time Celery worker stats via inspect."""
    try:
        from app.tasks.celery_app import celery_app
        inspect = celery_app.control.inspect(timeout=2.0)

        active_map   = inspect.active()   or {}
        reserved_map = inspect.reserved() or {}
        scheduled_map = inspect.scheduled() or {}

        worker_names = list(active_map.keys())
        active_count = sum(len(v) for v in active_map.values())
        reserved_count = sum(len(v) for v in reserved_map.values())
        scheduled_count = sum(len(v) for v in scheduled_map.values())

        return SuccessResponse(data=CeleryStats(
            workers=len(worker_names),
            active_tasks=active_count,
            reserved_tasks=reserved_count,
            scheduled_tasks=scheduled_count,
            worker_names=worker_names,
        ))
    except Exception as e:
        logger.warning("Celery inspect failed: %s", e)
        return SuccessResponse(data=CeleryStats(
            workers=0, active_tasks=0, reserved_tasks=0,
            scheduled_tasks=0, worker_names=[],
        ))


@router.get("/celery/schedule", response_model=SuccessResponse[List[BeatTask]])
async def celery_schedule(admin: User = Depends(require_admin)):
    """Return current beat schedule from celery config."""
    from app.tasks.celery_app import celery_app

    tasks = []
    for name, entry in celery_app.conf.beat_schedule.items():
        schedule = entry.get("schedule")
        cron_str = _crontab_to_str(schedule) if schedule else "?"
        tasks.append(BeatTask(
            name=name,
            task=entry.get("task", ""),
            schedule=cron_str,
            description=BEAT_DESCRIPTIONS.get(name, ""),
            enabled=True,
        ))

    return SuccessResponse(data=tasks)


@router.post("/celery/trigger/{task_name}", response_model=SuccessResponse[TriggerResponse])
async def trigger_task(
    task_name: str,
    admin: User = Depends(require_admin),
):
    """Trigger a Celery task by its dotted name."""
    allowed_tasks = {
        "app.tasks.scraping_tasks.scrape_uzex",
        "app.tasks.scraping_tasks.scrape_mc",
        "app.tasks.ml_tasks.retrain_price_model",
        "app.tasks.ml_tasks.evaluate_model_drift",
        "app.tasks.notification_tasks.send_daily_digest_all",
        "app.tasks.notification_tasks.send_deadline_reminders",
        "app.tasks.cleanup_tasks.cleanup_old_notifications",
        "app.tasks.cleanup_tasks.verify_backup",
        "app.tasks.matching_tasks.run_all_matches",
    }
    if task_name not in allowed_tasks:
        raise HTTPException(status_code=400, detail=f"Task '{task_name}' ruxsat etilmagan")

    try:
        from app.tasks.celery_app import celery_app
        result = celery_app.send_task(task_name)
        return SuccessResponse(
            data=TriggerResponse(task_name=task_name, task_id=result.id, status="queued"),
            message=f"Task navbatga qo'shildi: {result.id}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task yuborishda xato: {str(e)}")


# ── Scraper endpoints ─────────────────────────────────────────────────────────

@router.get("/scrapers", response_model=SuccessResponse[List[ScraperStatus]])
async def scraper_list(admin: User = Depends(require_admin)):
    """Return scraper list with last known result from Redis."""
    try:
        from app.services.auth.cache_service import cache_service

        scrapers = []
        for name, task_name in SCRAPER_MAP.items():
            cache_key = f"scraper:last_result:{name.lower()}"
            last_result = await cache_service.get(cache_key)

            scrapers.append(ScraperStatus(
                name=name,
                task_name=task_name,
                status="active",
                last_result=last_result if isinstance(last_result, dict) else None,
            ))
        return SuccessResponse(data=scrapers)
    except Exception as e:
        logger.warning("Scraper list error: %s", e)
        return SuccessResponse(data=[
            ScraperStatus(name=name, task_name=task, status="unavailable", last_result=None)
            for name, task in SCRAPER_MAP.items()
        ])


@router.post("/scrapers/{name}/run", response_model=SuccessResponse[TriggerResponse])
async def run_scraper(
    name: str,
    admin: User = Depends(require_admin),
):
    """Manually trigger a scraper task."""
    task_name = SCRAPER_MAP.get(name.upper()) or SCRAPER_MAP.get(name)
    if not task_name:
        raise HTTPException(status_code=404, detail=f"'{name}' scraper topilmadi")

    try:
        from app.tasks.celery_app import celery_app
        result = celery_app.send_task(task_name)
        return SuccessResponse(
            data=TriggerResponse(task_name=task_name, task_id=result.id, status="queued"),
            message=f"{name} scraper ishga tushirildi",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── ML model endpoints ────────────────────────────────────────────────────────

@router.get("/ml/models", response_model=SuccessResponse[List[MLModelInfo]])
async def ml_models_list(admin: User = Depends(require_admin)):
    """List ML models and their statuses."""
    models = []
    for name, task_name in ML_MODEL_MAP.items():
        models.append(MLModelInfo(
            name=name,
            task_name=task_name,
            status="loaded",
        ))
    return SuccessResponse(data=models)


@router.post("/ml/retrain/{model_name}", response_model=SuccessResponse[TriggerResponse])
async def retrain_model(
    model_name: str,
    admin: User = Depends(require_admin),
):
    """Trigger ML model retraining task."""
    task_name = ML_MODEL_MAP.get(model_name)
    if not task_name:
        raise HTTPException(status_code=404, detail=f"'{model_name}' model topilmadi")

    try:
        from app.tasks.celery_app import celery_app
        result = celery_app.send_task(task_name)
        return SuccessResponse(
            data=TriggerResponse(task_name=task_name, task_id=result.id, status="queued"),
            message=f"{model_name} qayta o'qitish boshlandi",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Telegram bot endpoints ────────────────────────────────────────────────────

@router.get("/bot/info", response_model=SuccessResponse[BotInfo])
async def bot_info(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return Telegram bot stats from DB and config."""
    registered = await db.scalar(
        select(func.count()).select_from(User).where(User.telegram_id.isnot(None))
    ) or 0

    active_groups = await db.scalar(
        select(func.count()).select_from(BotGroup).where(BotGroup.is_active.is_(True))
    ) or 0

    token = settings.TELEGRAM_BOT_TOKEN or ""
    token_masked = f"{token[:6]}***:{token.split(':')[-1][:3]}***" if ":" in token else "***"

    return SuccessResponse(data=BotInfo(
        username=settings.TELEGRAM_BOT_USERNAME or "@TenderIQBot",
        registered_users=registered,
        active_groups=active_groups,
        webhook_url=settings.TELEGRAM_WEBHOOK_URL or "",
        token_masked=token_masked,
    ))


@router.post("/bot/broadcast", response_model=SuccessResponse[dict])
async def bot_broadcast(
    data: BotBroadcastRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Send a Telegram message to all users with telegram_id."""
    if not data.message.strip():
        raise HTTPException(status_code=400, detail="Xabar matni bo'sh bo'lishi mumkin emas")

    if not settings.TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=503, detail="Telegram bot token sozlanmagan")

    result = await db.execute(
        select(User.telegram_id).where(
            User.telegram_id.isnot(None),
            User.is_active.is_(True),
            User.notify_telegram.is_(True),
        )
    )
    telegram_ids = [row[0] for row in result.fetchall()]

    if not telegram_ids:
        return SuccessResponse(data={"sent": 0, "message": "Telegram foydalanuvchilar yo'q"})

    try:
        import httpx
        sent = 0
        failed = 0
        async with httpx.AsyncClient(timeout=10.0) as client:
            for tg_id in telegram_ids[:500]:  # max 500 per request
                try:
                    resp = await client.post(
                        f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage",
                        json={"chat_id": tg_id, "text": data.message},
                    )
                    if resp.status_code == 200:
                        sent += 1
                    else:
                        logger.warning("Telegram send failed for chat_id=%s: HTTP %s", tg_id, resp.status_code)
                        failed += 1
                except (httpx.TimeoutException, httpx.NetworkError) as e:
                    logger.warning("Telegram network error for chat_id=%s: %s", tg_id, e)
                    failed += 1

        return SuccessResponse(
            data={"sent": sent, "failed": failed, "total": len(telegram_ids)},
            message=f"{sent} ta foydalanuvchiga Telegram xabar yuborildi",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Telegram xabar yuborishda xato: {str(e)}")


# ── Connection test endpoint ──────────────────────────────────────────────────

@router.post("/connections/test", response_model=SuccessResponse[ConnectionTestResult])
async def test_connection(
    data: ConnectionTestRequest,
    admin: User = Depends(require_admin),
):
    """Test connectivity to a specific service."""
    service = data.service.lower()
    t0 = time.perf_counter()

    if service == "postgres":
        try:
            from app.database import async_session
            from sqlalchemy import text
            async with async_session() as session:
                await session.execute(text("SELECT 1"))
            latency = round((time.perf_counter() - t0) * 1000, 1)
            return SuccessResponse(data=ConnectionTestResult(
                service="postgres", status="ok", latency_ms=latency
            ))
        except Exception as e:
            return SuccessResponse(data=ConnectionTestResult(
                service="postgres", status="error", detail=str(e)[:100]
            ))

    elif service == "redis":
        try:
            from app.services.auth.cache_service import cache_service
            await cache_service.set("__conn_test__", "ok", expire=5)
            val = await cache_service.get("__conn_test__")
            latency = round((time.perf_counter() - t0) * 1000, 1)
            status = "ok" if val == "ok" else "degraded"
            return SuccessResponse(data=ConnectionTestResult(
                service="redis", status=status, latency_ms=latency
            ))
        except Exception as e:
            return SuccessResponse(data=ConnectionTestResult(
                service="redis", status="error", detail=str(e)[:100]
            ))

    elif service == "smtp":
        try:
            import smtplib
            import ssl
            ctx = ssl.create_default_context()
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5) as s:
                s.ehlo()
                if settings.SMTP_PORT == 587:
                    s.starttls(context=ctx)
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            latency = round((time.perf_counter() - t0) * 1000, 1)
            return SuccessResponse(data=ConnectionTestResult(
                service="smtp", status="ok", latency_ms=latency
            ))
        except Exception as e:
            return SuccessResponse(data=ConnectionTestResult(
                service="smtp", status="error", detail=str(e)[:100]
            ))

    elif service == "telegram":
        try:
            if not settings.TELEGRAM_BOT_TOKEN:
                return SuccessResponse(data=ConnectionTestResult(
                    service="telegram", status="not_configured", detail="Token sozlanmagan"
                ))
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/getMe"
                )
            latency = round((time.perf_counter() - t0) * 1000, 1)
            ok = resp.status_code == 200 and resp.json().get("ok")
            return SuccessResponse(data=ConnectionTestResult(
                service="telegram",
                status="ok" if ok else "error",
                latency_ms=latency,
                detail=None if ok else resp.text[:100],
            ))
        except Exception as e:
            return SuccessResponse(data=ConnectionTestResult(
                service="telegram", status="error", detail=str(e)[:100]
            ))

    elif service in ("click", "payme"):
        return SuccessResponse(data=ConnectionTestResult(
            service=service,
            status="not_configured" if not getattr(settings, f"{service.upper()}_MERCHANT_ID", None) else "ok",
            detail="To'lov tizimi konfiguratsiyasi tekshirilmagan",
        ))

    else:
        raise HTTPException(status_code=400, detail=f"'{service}' noma'lum servis")
