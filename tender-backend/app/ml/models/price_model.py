"""Random Forest price prediction model."""

import logging
from datetime import datetime, timezone
from typing import Any

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score

from app.ml.base_model import BaseMLModel

logger = logging.getLogger(__name__)


class PriceModel(BaseMLModel):
    """Predicts optimal bid price using Random Forest regression."""

    model_name = "price_predictor"

    def __init__(self) -> None:
        super().__init__()
        self._feature_names: list[str] = []
        self._category_encoder: dict[str, int] = {}
        self._region_encoder: dict[str, int] = {}

    def train(self, X: np.ndarray, y: np.ndarray) -> dict[str, float]:
        """Train Random Forest model with cross-validation."""
        self._model = RandomForestRegressor(
            n_estimators=100,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )

        cv_scores = cross_val_score(self._model, X, y, cv=5, scoring="r2")

        self._model.fit(X, y)

        self._version = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M")
        self._trained_at = datetime.now(timezone.utc)
        self._training_samples = len(X)
        self._feature_count = X.shape[1] if hasattr(X, "shape") else 0

        from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

        y_pred = self._model.predict(X)

        metrics = {
            "r2": float(r2_score(y, y_pred)),
            "mae": float(mean_absolute_error(y, y_pred)),
            "rmse": float(np.sqrt(mean_squared_error(y, y_pred))),
            "cv_r2_mean": float(cv_scores.mean()),
            "cv_r2_std": float(cv_scores.std()),
        }

        logger.info("Price model trained: %s", metrics)
        return metrics

    def predict(self, features: dict[str, Any]) -> dict[str, Any]:
        """Predict price with confidence interval."""
        if self._model is None:
            return {
                "predicted_amount": 0,
                "confidence": 0,
                "lower_bound": 0,
                "upper_bound": 0,
            }

        feature_vector = self._encode_features(features)
        X = np.array([feature_vector])

        tree_predictions = np.array([tree.predict(X)[0] for tree in self._model.estimators_])

        predicted = float(np.mean(tree_predictions))
        std = float(np.std(tree_predictions))

        confidence = max(0, min(100, 100 - (std / max(predicted, 1)) * 100))

        return {
            "predicted_amount": round(predicted, 2),
            "confidence": round(confidence, 2),
            "lower_bound": round(predicted - 1.96 * std, 2),
            "upper_bound": round(predicted + 1.96 * std, 2),
        }

    def get_feature_importance(self) -> dict[str, float]:
        """Return feature importance scores."""
        if not self._model or not self._feature_names:
            return {}
        importances = self._model.feature_importances_
        return dict(zip(self._feature_names, [float(i) for i in importances]))

    def set_encoders(
        self,
        categories: dict[str, int],
        regions: dict[str, int],
        feature_names: list[str],
    ) -> None:
        """Set category and region encoders after training."""
        self._category_encoder = categories
        self._region_encoder = regions
        self._feature_names = feature_names

    def _encode_features(self, features: dict[str, Any]) -> list[float]:
        """Encode raw features into numeric vector."""
        category_code = self._category_encoder.get(features.get("category", ""), 0)
        region_code = self._region_encoder.get(features.get("region", ""), 0)
        return [float(category_code), float(region_code)]
