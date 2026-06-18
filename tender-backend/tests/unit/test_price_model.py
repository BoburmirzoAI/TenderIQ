"""Unit tests for price prediction model."""

import os
import tempfile

import numpy as np
import pytest

from app.ml.price_model import PriceModel


class TestPriceModel:
    """Tests for PriceModel training and prediction."""

    @pytest.fixture
    def trained_model(self):
        model = PriceModel()
        np.random.seed(42)
        X = np.random.rand(200, 2)
        y = X[:, 0] * 1e8 + X[:, 1] * 5e7 + np.random.rand(200) * 1e7
        model.train(X, y)
        return model

    def test_prediction_returns_valid_range(self, trained_model):
        result = trained_model.predict({"category": "it", "region": "tashkent_city"})
        assert result["predicted_amount"] > 0
        assert result["lower_bound"] <= result["predicted_amount"]
        assert result["upper_bound"] >= result["predicted_amount"]

    def test_confidence_interval(self, trained_model):
        result = trained_model.predict({"category": "it", "region": "tashkent_city"})
        assert 0 <= result["confidence"] <= 100

    def test_untrained_model_returns_zero(self):
        model = PriceModel()
        result = model.predict({"category": "it", "region": "tashkent_city"})
        assert result["predicted_amount"] == 0

    def test_model_save_load(self, trained_model):
        with tempfile.NamedTemporaryFile(suffix=".pkl", delete=False) as f:
            path = f.name

        try:
            trained_model.save(path)
            loaded = PriceModel()
            loaded.load(path)
            assert loaded.is_trained
            assert loaded.version == trained_model.version
        finally:
            os.unlink(path)

    def test_training_returns_metrics(self):
        model = PriceModel()
        X = np.random.rand(100, 2)
        y = X[:, 0] * 1e8 + np.random.rand(100) * 1e7
        metrics = model.train(X, y)
        assert "r2" in metrics
        assert "mae" in metrics
        assert "rmse" in metrics

    def test_cross_validation_score(self):
        model = PriceModel()
        X = np.random.rand(100, 2)
        y = X[:, 0] * 1e8 + np.random.rand(100) * 1e7
        metrics = model.train(X, y)
        assert "cv_r2_mean" in metrics
