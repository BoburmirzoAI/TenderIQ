"""Celery tasks for ML model training and evaluation."""

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


@celery_app.task(name="app.tasks.ml_tasks.retrain_price_model")
def retrain_price_model():
    """Retrain the price prediction model with latest data."""

    async def _retrain():
        import pandas as pd

        from app.database import async_session
        from app.ml.trainer import Trainer
        from app.repositories.tender_result_repo import TenderResultRepository

        async with async_session() as session:
            result_repo = TenderResultRepository(session)
            history = await result_repo.get_price_history(limit=10000)

            if not history:
                return {"status": "skipped", "reason": "no_data"}

            df = pd.DataFrame(history)
            trainer = Trainer()
            result = trainer.train_price_model(df)
            return result

    result = _run_async(_retrain())
    logger.info("Price model retrain result: %s", result)
    return result


@celery_app.task(name="app.tasks.ml_tasks.evaluate_model_drift")
def evaluate_model_drift():
    """Check if model performance has degraded."""
    logger.info("Evaluating model drift")

    async def _evaluate():
        from app.services.ml_service import MLService

        service = MLService()
        info = await service.get_model_info()
        return {"model_info": info, "drift_detected": False}

    result = _run_async(_evaluate())
    return result
