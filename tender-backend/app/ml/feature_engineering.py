"""Feature engineering for ML models."""

import logging
from typing import Any

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def prepare_features(
    df: pd.DataFrame,
) -> tuple[np.ndarray, np.ndarray, list[str], dict[str, dict[str, int]]]:
    """Prepare feature matrix from raw tender result data."""
    required = ["category", "region", "winning_amount"]
    for col in required:
        if col not in df.columns:
            logger.error("Missing required column: %s", col)
            return np.array([]), np.array([]), [], {}

    df = df.dropna(subset=["winning_amount"])
    df = df[df["winning_amount"] > 0]

    if len(df) == 0:
        return np.array([]), np.array([]), [], {}

    category_encoder = encode_categoricals(df["category"].fillna("other"))
    region_encoder = encode_categoricals(df["region"].fillna("unknown"))

    df = df.copy()
    df["category_code"] = df["category"].fillna("other").map(category_encoder)
    df["region_code"] = df["region"].fillna("unknown").map(region_encoder)

    feature_names = ["category_code", "region_code"]
    X = df[feature_names].values.astype(float)
    y = df["winning_amount"].values.astype(float)

    encoders = {"category": category_encoder, "region": region_encoder}

    return X, y, feature_names, encoders


def encode_categoricals(series: pd.Series) -> dict[str, int]:
    """Create integer encoding for categorical values."""
    unique_values = sorted(series.unique())
    return {val: idx for idx, val in enumerate(unique_values)}


def log_transform(y: np.ndarray) -> np.ndarray:
    """Apply log1p transform to target variable."""
    return np.log1p(y)


def inverse_log_transform(y: np.ndarray) -> np.ndarray:
    """Reverse log1p transform."""
    return np.expm1(y)
