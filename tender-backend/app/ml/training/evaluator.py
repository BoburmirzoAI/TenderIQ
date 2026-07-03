"""Model evaluation utilities."""

import logging
from typing import Any

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

logger = logging.getLogger(__name__)


def evaluate_regression(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    """Compute regression evaluation metrics."""
    return {
        "r2": float(r2_score(y_true, y_pred)),
        "mae": float(mean_absolute_error(y_true, y_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "mape": float(_mean_absolute_percentage_error(y_true, y_pred)),
    }


def feature_importance(model: Any, feature_names: list[str]) -> list[dict[str, Any]]:
    """Extract and sort feature importance from a tree-based model."""
    if not hasattr(model, "feature_importances_"):
        return []
    importances = model.feature_importances_
    features = sorted(
        zip(feature_names, importances),
        key=lambda x: x[1],
        reverse=True,
    )
    return [{"feature": name, "importance": float(imp)} for name, imp in features]


def _mean_absolute_percentage_error(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Calculate MAPE, handling zero values."""
    mask = y_true != 0
    if not mask.any():
        return 0.0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)
