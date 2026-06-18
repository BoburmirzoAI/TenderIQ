"""Abstract base class for ML models with versioned save/load."""

import logging
import os
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Optional

import joblib

logger = logging.getLogger(__name__)


class BaseMLModel(ABC):
    """Base class for all ML models with persistence support."""

    model_name: str = "base"

    def __init__(self) -> None:
        self._model: Any = None
        self._version: str = "0.0.0"
        self._trained_at: Optional[datetime] = None
        self._training_samples: int = 0
        self._feature_count: int = 0

    @property
    def is_trained(self) -> bool:
        """Check if model has been trained."""
        return self._model is not None

    @property
    def version(self) -> str:
        """Get model version string."""
        return self._version

    @property
    def training_samples(self) -> int:
        """Number of samples used for training."""
        return self._training_samples

    @property
    def feature_count(self) -> int:
        """Number of features the model expects."""
        return self._feature_count

    def save(self, path: str) -> None:
        """Save model and metadata to disk."""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        data = {
            "model": self._model,
            "version": self._version,
            "trained_at": self._trained_at,
            "training_samples": self._training_samples,
            "feature_count": self._feature_count,
            "model_name": self.model_name,
        }
        joblib.dump(data, path)
        logger.info("Model %s saved to %s", self.model_name, path)

    def load(self, path: str) -> None:
        """Load model and metadata from disk."""
        if not os.path.exists(path):
            logger.warning("Model file not found: %s", path)
            return
        data = joblib.load(path)
        self._model = data["model"]
        self._version = data.get("version", "0.0.0")
        self._trained_at = data.get("trained_at")
        self._training_samples = data.get("training_samples", 0)
        self._feature_count = data.get("feature_count", 0)
        logger.info("Model %s loaded from %s (v%s)", self.model_name, path, self._version)

    @abstractmethod
    def train(self, X: Any, y: Any) -> dict[str, float]:
        """Train the model. Returns metrics dict."""
        ...

    @abstractmethod
    def predict(self, features: Any) -> Any:
        """Make a prediction."""
        ...
