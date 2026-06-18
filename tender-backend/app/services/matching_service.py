"""Tender-company matching service using TF-IDF and cosine similarity."""

import logging
import re
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import MATCH_SCORE_THRESHOLD, MATCH_WEIGHTS
from app.ml.uzbek_nlp import preprocess_text
from app.repositories.company_repo import CompanyRepository
from app.repositories.tender_match_repo import TenderMatchRepository
from app.repositories.tender_repo import TenderRepository

logger = logging.getLogger(__name__)


class MatchingService:
    """Calculates relevance scores between tenders and company profiles."""

    def __init__(self, session: AsyncSession) -> None:
        self.tender_repo = TenderRepository(session)
        self.company_repo = CompanyRepository(session)
        self.match_repo = TenderMatchRepository(session)

    async def calculate_score(
        self,
        tender_text: str,
        company_text: str,
        tender_category: Optional[str],
        company_categories: Optional[list[str]],
        tender_region: Optional[str],
        company_regions: Optional[list[str]],
        tender_amount: Optional[float],
        company_min_amount: Optional[float],
        company_max_amount: Optional[float],
    ) -> dict[str, float]:
        """Calculate weighted match score between a tender and company."""
        text_score = self._calculate_text_similarity(tender_text, company_text)
        category_score = self._calculate_category_score(tender_category, company_categories)
        region_score = self._calculate_region_score(tender_region, company_regions)
        amount_score = self._calculate_amount_score(
            tender_amount, company_min_amount, company_max_amount
        )

        total = (
            text_score * MATCH_WEIGHTS["text"]
            + category_score * MATCH_WEIGHTS["category"]
            + region_score * MATCH_WEIGHTS["region"]
            + amount_score * MATCH_WEIGHTS["amount"]
        )

        return {
            "total_score": round(total, 2),
            "text_score": round(text_score, 2),
            "category_score": round(category_score, 2),
            "region_score": round(region_score, 2),
            "amount_score": round(amount_score, 2),
        }

    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Compute cosine similarity between two texts using TF-IDF."""
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        processed1 = preprocess_text(text1)
        processed2 = preprocess_text(text2)

        if not processed1 or not processed2:
            return 0.0

        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=10000,
            analyzer="word",
        )

        try:
            tfidf_matrix = vectorizer.fit_transform([processed1, processed2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
            return float(similarity[0][0]) * 100
        except ValueError:
            return 0.0

    def _calculate_category_score(
        self,
        tender_category: Optional[str],
        company_categories: Optional[list[str]],
    ) -> float:
        """Score based on category match."""
        if not tender_category or not company_categories:
            return 0.0
        return 100.0 if tender_category in company_categories else 0.0

    def _calculate_region_score(
        self,
        tender_region: Optional[str],
        company_regions: Optional[list[str]],
    ) -> float:
        """Score based on region match."""
        if not tender_region or not company_regions:
            return 50.0
        return 100.0 if tender_region in company_regions else 0.0

    def _calculate_amount_score(
        self,
        tender_amount: Optional[float],
        min_amount: Optional[float],
        max_amount: Optional[float],
    ) -> float:
        """Score based on whether tender amount falls in company's preferred range."""
        if tender_amount is None:
            return 50.0
        if min_amount is None and max_amount is None:
            return 50.0

        in_range = True
        if min_amount is not None and tender_amount < min_amount:
            in_range = False
        if max_amount is not None and tender_amount > max_amount:
            in_range = False

        return 100.0 if in_range else 20.0

    async def find_matches_for_tender(self, tender_id: int) -> list[dict]:
        """Find all matching companies for a new tender."""
        tender = await self.tender_repo.get_by_id(tender_id)
        if not tender:
            return []

        companies = await self.company_repo.get_all_active()
        tender_text = f"{tender.title} {tender.description or ''} {tender.requirements or ''}"

        matches = []
        for company in companies:
            company_text = (
                f"{company.name} {company.description or ''} {company.keywords or ''}"
            )

            scores = await self.calculate_score(
                tender_text=tender_text,
                company_text=company_text,
                tender_category=tender.category,
                company_categories=company.categories,
                tender_region=tender.region,
                company_regions=company.regions,
                tender_amount=tender.amount,
                company_min_amount=company.min_amount,
                company_max_amount=company.max_amount,
            )

            if scores["total_score"] >= MATCH_SCORE_THRESHOLD:
                existing = await self.match_repo.get_by_tender_and_company(
                    tender_id, company.id
                )
                if not existing:
                    match = await self.match_repo.create(
                        {
                            "tender_id": tender_id,
                            "company_id": company.id,
                            "score": scores["total_score"],
                            "text_score": scores["text_score"],
                            "category_score": scores["category_score"],
                            "region_score": scores["region_score"],
                            "amount_score": scores["amount_score"],
                        }
                    )
                    matches.append(
                        {"match_id": match.id, "company_id": company.id, **scores}
                    )

        logger.info("Tender %d matched with %d companies", tender_id, len(matches))
        return matches

    async def batch_match(self, tender_ids: list[int]) -> int:
        """Run matching for multiple tenders, returning total matches found."""
        total = 0
        for tender_id in tender_ids:
            matches = await self.find_matches_for_tender(tender_id)
            total += len(matches)
        return total
