"""Full training pipeline with cross-validation and evaluation."""

import logging
import os
from typing import Any

import numpy as np
import pandas as pd

from app.config import settings
from app.ml.training.feature_engineering import encode_categoricals, log_transform, prepare_features
from app.ml.models.price_model import PriceModel

logger = logging.getLogger(__name__)


class Trainer:
    """Orchestrates model training pipeline."""

    def __init__(self) -> None:
        self.model_dir = settings.ML_MODEL_DIR

    def train_price_model(self, df: pd.DataFrame) -> dict[str, Any]:
        """Train the price prediction model from tender result data."""
        if len(df) < settings.ML_RETRAIN_MIN_SAMPLES:
            logger.warning(
                "Not enough samples for training: %d < %d",
                len(df),
                settings.ML_RETRAIN_MIN_SAMPLES,
            )
            return {"status": "skipped", "reason": "insufficient_samples"}

        X, y, feature_names, encoders = prepare_features(df)

        if len(X) == 0:
            return {"status": "failed", "reason": "no_valid_features"}

        y_log = log_transform(y)

        model = PriceModel()
        model.set_encoders(
            categories=encoders.get("category", {}),
            regions=encoders.get("region", {}),
            feature_names=feature_names,
        )

        metrics = model.train(X, y_log)

        model_path = os.path.join(self.model_dir, "price_model.pkl")
        model.save(model_path)

        return {
            "status": "success",
            "metrics": metrics,
            "samples": len(X),
            "version": model.version,
        }
