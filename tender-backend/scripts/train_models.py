"""Script to train and save ML models."""

import asyncio
import logging

import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def train() -> None:
    """Train all ML models."""
    from app.database import async_session
    from app.ml.training.trainer import Trainer
    from app.repositories.tenders.tender_result_repo import TenderResultRepository

    async with async_session() as session:
        result_repo = TenderResultRepository(session)
        history = await result_repo.get_price_history(limit=10000)

        if history:
            df = pd.DataFrame(history)
            trainer = Trainer()
            result = trainer.train_price_model(df)
            logger.info("Price model training result: %s", result)
        else:
            logger.info("No historical data found. Generating synthetic data for demo...")
            np.random.seed(42)
            df = pd.DataFrame(
                {
                    "category": np.random.choice(
                        ["construction", "it", "medical", "food"], 500
                    ),
                    "region": np.random.choice(
                        ["tashkent_city", "samarkand", "bukhara"], 500
                    ),
                    "winning_amount": np.random.uniform(10e6, 500e6, 500),
                }
            )
            trainer = Trainer()
            result = trainer.train_price_model(df)
            logger.info("Synthetic model training result: %s", result)


if __name__ == "__main__":
    asyncio.run(train())
