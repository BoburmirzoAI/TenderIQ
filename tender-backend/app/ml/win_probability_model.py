"""Win probability prediction model using Gradient Boosting."""

import logging
from datetime import datetime, timezone
from typing import Any, Optional

import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import cross_val_score

from app.ml.base_model import BaseMLModel

logger = logging.getLogger(__name__)


class WinProbabilityModel(BaseMLModel):
    """Predicts probability of winning a tender using historical data and features."""

    model_name = "win_probability"

    def __init__(self) -> None:
        super().__init__()
        self._category_encoder: dict[str, int] = {}
        self._region_encoder: dict[str, int] = {}
        self._org_encoder: dict[str, int] = {}
        self._feature_names: list[str] = []
        self._feature_importances: dict[str, float] = {}
        self._class_distribution: dict[str, float] = {}

    def train(self, X: np.ndarray, y: np.ndarray) -> dict[str, float]:
        """Train Gradient Boosting classifier."""
        self._model = GradientBoostingClassifier(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.1,
            min_samples_split=10,
            min_samples_leaf=5,
            subsample=0.8,
            random_state=42,
        )

        cv_scores = cross_val_score(self._model, X, y, cv=5, scoring="roc_auc")
        self._model.fit(X, y)

        self._version = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M")
        self._trained_at = datetime.now(timezone.utc)
        self._training_samples = len(X)
        self._feature_count = X.shape[1] if hasattr(X, "shape") else 0

        if self._feature_names:
            self._feature_importances = dict(
                zip(self._feature_names, [float(i) for i in self._model.feature_importances_])
            )

        win_count = int(np.sum(y == 1))
        total = len(y)
        self._class_distribution = {
            "wins": win_count,
            "losses": total - win_count,
            "win_rate": round(win_count / max(total, 1) * 100, 1),
        }

        from sklearn.metrics import accuracy_score, roc_auc_score

        y_pred = self._model.predict(X)
        y_proba = self._model.predict_proba(X)[:, 1]

        metrics = {
            "accuracy": float(accuracy_score(y, y_pred)),
            "roc_auc": float(roc_auc_score(y, y_proba)),
            "cv_auc_mean": float(cv_scores.mean()),
            "cv_auc_std": float(cv_scores.std()),
        }

        logger.info("Win probability model trained: %s", metrics)
        return metrics

    def predict(self, features: dict[str, Any]) -> dict[str, Any]:
        """Predict win probability with factor breakdown."""
        if self._model is None:
            return self._rule_based_prediction(features)

        feature_vector = self._encode_features(features)
        X = np.array([feature_vector])

        win_prob = float(self._model.predict_proba(X)[0][1]) * 100

        factors = self._analyze_factors(features, win_prob)

        if win_prob >= 70:
            risk_level = "past"
            recommendation = "Kuchli pozitsiya. Ariza berish tavsiya etiladi."
        elif win_prob >= 45:
            risk_level = "o'rta"
            recommendation = "O'rtacha imkoniyat. Raqobatbardosh narx taklif qiling."
        else:
            risk_level = "yuqori"
            recommendation = "Past ehtimollik. Strategiyani qayta ko'rib chiqing."

        return {
            "win_probability": round(win_prob, 1),
            "risk_level": risk_level,
            "recommendation": recommendation,
            "factors": factors,
            "model_version": self._version,
            "confidence": self._calculate_confidence(features),
        }

    def _rule_based_prediction(self, features: dict[str, Any]) -> dict[str, Any]:
        """Fallback rule-based prediction when model is not trained."""
        score = 50.0
        factors = []

        bid_ratio = features.get("bid_ratio")
        if bid_ratio is not None:
            if bid_ratio < 0.75:
                bid_impact = round(-5 + (bid_ratio - 0.70) * 60, 1)
                detail = "Shubhali past narx — diskvalifikatsiya xavfi"
            elif bid_ratio < 0.85:
                bid_impact = round(12 + (0.85 - bid_ratio) * 30, 1)
                detail = "Tender summasidan sezilarli past taklif"
            elif bid_ratio < 0.95:
                bid_impact = round(4 + (0.95 - bid_ratio) * 80, 1)
                detail = "Tender summasidan past taklif"
            elif bid_ratio <= 1.05:
                bid_impact = round((1.0 - bid_ratio) * 40, 1)
                detail = "Tender summasiga yaqin taklif"
            else:
                bid_impact = round(max(-20, -5 - (bid_ratio - 1.05) * 100), 1)
                detail = "Tender summasidan yuqori taklif"
            bid_impact = round(max(-20, min(15, bid_impact)), 1)
            score += bid_impact
            factors.append({"name": "Narx ustunligi", "impact": bid_impact, "detail": detail})

        experience = features.get("company_experience", 0)
        if experience >= 5:
            score += 10
            factors.append({"name": "Tajriba", "impact": 10, "detail": f"{experience} yillik tajriba"})
        elif experience >= 2:
            score += 5
            factors.append({"name": "Tajriba", "impact": 5, "detail": f"{experience} yillik tajriba"})
        else:
            factors.append({"name": "Tajriba", "impact": 0, "detail": "Kam tajriba"})

        cat_match = features.get("category_match", False)
        if cat_match:
            score += 10
            factors.append({"name": "Soha mosligi", "impact": 10, "detail": "Kompaniya sohasi tender kategoriyasiga mos"})
        else:
            score -= 5
            factors.append({"name": "Soha mosligi", "impact": -5, "detail": "Soha mos emas"})

        region_match = features.get("region_match", False)
        if region_match:
            score += 8
            factors.append({"name": "Hudud mosligi", "impact": 8, "detail": "Mahalliy ustunlik"})
        else:
            factors.append({"name": "Hudud mosligi", "impact": 0, "detail": "Boshqa hududdan"})

        days_left = features.get("days_until_deadline")
        if days_left is not None:
            if days_left < 3:
                score -= 10
                factors.append({"name": "Muddat", "impact": -10, "detail": f"Faqat {days_left} kun qoldi"})
            elif days_left < 7:
                score -= 3
                factors.append({"name": "Muddat", "impact": -3, "detail": f"{days_left} kun qoldi"})
            else:
                score += 3
                factors.append({"name": "Muddat", "impact": 3, "detail": f"{days_left} kun qoldi — yetarli vaqt"})

        competitors = features.get("competitor_count", 5)
        if competitors <= 3:
            score += 10
            factors.append({"name": "Raqobat", "impact": 10, "detail": f"Kam raqobat ({competitors} ta ishtirokchi)"})
        elif competitors <= 7:
            factors.append({"name": "Raqobat", "impact": 0, "detail": f"O'rtacha raqobat ({competitors} ta)"})
        else:
            score -= 8
            factors.append({"name": "Raqobat", "impact": -8, "detail": f"Yuqori raqobat ({competitors} ta)"})

        win_prob = max(5, min(95, score))

        if win_prob >= 70:
            risk_level = "past"
            recommendation = "Kuchli pozitsiya. Ariza berish tavsiya etiladi."
        elif win_prob >= 45:
            risk_level = "o'rta"
            recommendation = "O'rtacha imkoniyat. Raqobatbardosh narx taklif qiling."
        else:
            risk_level = "yuqori"
            recommendation = "Past ehtimollik. Strategiyani qayta ko'rib chiqing."

        return {
            "win_probability": round(win_prob, 1),
            "risk_level": risk_level,
            "recommendation": recommendation,
            "factors": factors,
            "model_version": "rule-based-v1",
            "confidence": 60.0,
        }

    def _analyze_factors(self, features: dict[str, Any], win_prob: float) -> list[dict]:
        """Break down prediction into interpretable factors."""
        factors = []

        if self._feature_importances:
            top_features = sorted(
                self._feature_importances.items(), key=lambda x: x[1], reverse=True
            )[:6]

            feature_labels = {
                "bid_ratio": "Narx ustunligi",
                "category_code": "Kategoriya",
                "region_code": "Hudud",
                "days_until_deadline": "Muddat",
                "amount_log": "Tender summasi",
                "competitor_count": "Raqobat darajasi",
                "company_experience": "Kompaniya tajribasi",
                "category_match": "Soha mosligi",
                "region_match": "Hudud mosligi",
                "past_wins_category": "Sohada oldingi g'alabalar",
            }

            for feat_name, importance in top_features:
                label = feature_labels.get(feat_name, feat_name)
                impact = round(importance * 100, 1)
                factors.append({
                    "name": label,
                    "impact": impact,
                    "detail": f"Model uchun {impact}% ahamiyatga ega",
                })

        if not factors:
            factors = self._rule_based_prediction(features).get("factors", [])

        return factors

    def _calculate_confidence(self, features: dict[str, Any]) -> float:
        """Calculate prediction confidence based on available data."""
        confidence = 50.0
        if features.get("bid_ratio") is not None:
            confidence += 15
        if features.get("category_match") is not None:
            confidence += 10
        if features.get("region_match") is not None:
            confidence += 5
        if features.get("days_until_deadline") is not None:
            confidence += 5
        if features.get("company_experience") is not None:
            confidence += 10
        if features.get("competitor_count") is not None:
            confidence += 5
        return min(confidence, 95.0)

    def _encode_features(self, features: dict[str, Any]) -> list[float]:
        """Encode features into numeric vector."""
        cat_code = float(self._category_encoder.get(features.get("category", ""), 0))
        reg_code = float(self._region_encoder.get(features.get("region", ""), 0))
        bid_ratio = float(features.get("bid_ratio", 0.9))
        days_left = float(features.get("days_until_deadline", 14))
        amount_log = float(np.log1p(features.get("tender_amount", 0)))
        competitors = float(features.get("competitor_count", 5))
        experience = float(features.get("company_experience", 0))
        cat_match = 1.0 if features.get("category_match") else 0.0
        reg_match = 1.0 if features.get("region_match") else 0.0
        past_wins = float(features.get("past_wins_category", 0))

        return [
            cat_code, reg_code, bid_ratio, days_left, amount_log,
            competitors, experience, cat_match, reg_match, past_wins,
        ]

    def set_encoders(
        self,
        categories: dict[str, int],
        regions: dict[str, int],
        feature_names: list[str],
    ) -> None:
        self._category_encoder = categories
        self._region_encoder = regions
        self._feature_names = feature_names

    def save(self, path: str) -> None:
        import os
        os.makedirs(os.path.dirname(path), exist_ok=True)
        import joblib
        data = {
            "model": self._model,
            "version": self._version,
            "trained_at": self._trained_at,
            "training_samples": self._training_samples,
            "feature_count": self._feature_count,
            "model_name": self.model_name,
            "category_encoder": self._category_encoder,
            "region_encoder": self._region_encoder,
            "feature_names": self._feature_names,
            "feature_importances": self._feature_importances,
            "class_distribution": self._class_distribution,
        }
        joblib.dump(data, path)

    def load(self, path: str) -> None:
        import os
        if not os.path.exists(path):
            return
        import joblib
        data = joblib.load(path)
        self._model = data["model"]
        self._version = data.get("version", "0.0.0")
        self._trained_at = data.get("trained_at")
        self._training_samples = data.get("training_samples", 0)
        self._feature_count = data.get("feature_count", 0)
        self._category_encoder = data.get("category_encoder", {})
        self._region_encoder = data.get("region_encoder", {})
        self._feature_names = data.get("feature_names", [])
        self._feature_importances = data.get("feature_importances", {})
        self._class_distribution = data.get("class_distribution", {})
