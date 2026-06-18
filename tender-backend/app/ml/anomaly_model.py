"""Anomaly detection model for tender price and winner patterns."""

import logging
from typing import Any

import numpy as np
from sklearn.ensemble import IsolationForest

from app.ml.base_model import BaseMLModel

logger = logging.getLogger(__name__)


class AnomalyModel(BaseMLModel):
    """Detects dominant winners and price anomalies using Isolation Forest."""

    model_name = "anomaly_detector"

    def train(self, X: np.ndarray, y: Any = None) -> dict[str, float]:
        """Train Isolation Forest on price/winner features."""
        self._model = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42,
        )
        self._model.fit(X)
        self._training_samples = len(X)
        self._feature_count = X.shape[1] if hasattr(X, "shape") else 0

        predictions = self._model.predict(X)
        anomaly_count = int(np.sum(predictions == -1))

        logger.info(
            "Anomaly model trained: %d samples, %d anomalies", len(X), anomaly_count
        )
        return {
            "total_samples": len(X),
            "anomalies_detected": anomaly_count,
            "anomaly_ratio": anomaly_count / len(X) if len(X) > 0 else 0,
        }

    def predict(self, features: np.ndarray) -> dict[str, Any]:
        """Detect if given features are anomalous."""
        if self._model is None:
            return {"is_anomaly": False, "score": 0.0}

        X = features.reshape(1, -1) if features.ndim == 1 else features
        prediction = self._model.predict(X)[0]
        score = float(self._model.score_samples(X)[0])

        return {
            "is_anomaly": prediction == -1,
            "score": score,
        }
