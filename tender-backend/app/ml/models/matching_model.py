"""TF-IDF + cosine similarity matching model."""

import logging
from typing import Any, Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.ml.base_model import BaseMLModel
from app.ml.nlp.uzbek_nlp import preprocess_text

logger = logging.getLogger(__name__)


class MatchingModel(BaseMLModel):
    """Calculates text similarity using TF-IDF vectors."""

    model_name = "matcher"

    def __init__(self) -> None:
        super().__init__()
        self._vectorizer: Optional[TfidfVectorizer] = None

    def train(self, X: Any, y: Any = None) -> dict[str, float]:
        """Fit the TF-IDF vectorizer on a corpus of texts."""
        self._vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=10000,
            analyzer="word",
            sublinear_tf=True,
        )

        processed = [preprocess_text(text) for text in X]
        processed = [t for t in processed if t]

        if not processed:
            return {"vocabulary_size": 0}

        self._vectorizer.fit(processed)
        self._model = self._vectorizer
        self._training_samples = len(processed)
        self._feature_count = len(self._vectorizer.vocabulary_)

        logger.info("Matching model trained on %d documents", len(processed))
        return {"vocabulary_size": self._feature_count}

    def predict(self, features: dict[str, str]) -> dict[str, float]:
        """Calculate similarity between two texts."""
        text1 = features.get("text1", "")
        text2 = features.get("text2", "")
        score = self.calculate_similarity(text1, text2)
        return {"similarity": score}

    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Compute cosine similarity between two texts."""
        processed1 = preprocess_text(text1)
        processed2 = preprocess_text(text2)

        if not processed1 or not processed2:
            return 0.0

        vectorizer = self._vectorizer or TfidfVectorizer(
            ngram_range=(1, 2), max_features=10000
        )

        try:
            if self._vectorizer:
                vectors = self._vectorizer.transform([processed1, processed2])
            else:
                vectors = vectorizer.fit_transform([processed1, processed2])

            sim = cosine_similarity(vectors[0:1], vectors[1:2])
            return float(sim[0][0]) * 100
        except ValueError:
            return 0.0
