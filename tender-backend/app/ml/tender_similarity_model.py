"""Tender similarity analysis using TF-IDF and multi-factor comparison."""

import logging
from typing import Any

from app.ml.matching_model import MatchingModel
from app.ml.uzbek_nlp import preprocess_text

logger = logging.getLogger(__name__)


class TenderSimilarityModel:
    """Compares tenders using text similarity and structured features."""

    def __init__(self) -> None:
        self._matcher = MatchingModel()

    def compare_two(self, tender_a: dict[str, Any], tender_b: dict[str, Any]) -> dict[str, Any]:
        """Compare two tenders and return similarity breakdown."""
        text_a = self._build_text(tender_a)
        text_b = self._build_text(tender_b)
        text_sim = self._matcher.calculate_similarity(text_a, text_b)

        cat_sim = 100.0 if tender_a.get("category") == tender_b.get("category") else 0.0
        region_sim = 100.0 if tender_a.get("region") == tender_b.get("region") else 0.0

        amount_a = tender_a.get("amount", 0) or 0
        amount_b = tender_b.get("amount", 0) or 0
        if amount_a > 0 and amount_b > 0:
            ratio = min(amount_a, amount_b) / max(amount_a, amount_b)
            amount_sim = round(ratio * 100, 1)
        else:
            amount_sim = 0.0

        overall = round(
            text_sim * 0.45 +
            cat_sim * 0.25 +
            region_sim * 0.15 +
            amount_sim * 0.15,
            1,
        )

        factors = [
            {"name": "Matn o'xshashligi", "score": round(text_sim, 1), "weight": 45},
            {"name": "Kategoriya", "score": round(cat_sim, 1), "weight": 25},
            {"name": "Hudud", "score": round(region_sim, 1), "weight": 15},
            {"name": "Summa", "score": round(amount_sim, 1), "weight": 15},
        ]

        return {
            "overall_similarity": overall,
            "factors": factors,
            "level": self._get_level(overall),
        }

    def find_similar(
        self,
        target: dict[str, Any],
        candidates: list[dict[str, Any]],
        top_n: int = 5,
    ) -> list[dict[str, Any]]:
        """Find most similar tenders from a list of candidates."""
        results = []

        for candidate in candidates:
            comparison = self.compare_two(target, candidate)
            results.append({
                "tender": candidate,
                "similarity": comparison["overall_similarity"],
                "factors": comparison["factors"],
                "level": comparison["level"],
            })

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_n]

    def compare_text_only(self, text1: str, text2: str) -> dict[str, Any]:
        """Simple text-to-text similarity comparison."""
        sim = self._matcher.calculate_similarity(text1, text2)
        return {
            "similarity": round(sim, 1),
            "level": self._get_level(sim),
            "processed_text1": preprocess_text(text1)[:200],
            "processed_text2": preprocess_text(text2)[:200],
        }

    def _build_text(self, tender: dict[str, Any]) -> str:
        parts = []
        if tender.get("title"):
            parts.append(tender["title"])
        if tender.get("description"):
            parts.append(tender["description"])
        if tender.get("organization"):
            parts.append(tender["organization"])
        if tender.get("requirements"):
            parts.append(tender["requirements"])
        return " ".join(parts)

    def _get_level(self, score: float) -> str:
        if score >= 75:
            return "yuqori"
        elif score >= 45:
            return "o'rta"
        return "past"
