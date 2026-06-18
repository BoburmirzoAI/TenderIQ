"""Unit tests for matching service."""

import pytest


class TestMatchingScore:
    """Tests for match score calculation."""

    @pytest.fixture
    def matching_service(self, db_session):
        from app.services.matching_service import MatchingService
        return MatchingService(db_session)

    async def test_high_text_similarity(self, matching_service):
        scores = await matching_service.calculate_score(
            tender_text="qurilish materiallari yetkazib berish Toshkent shahri",
            company_text="qurilish materiallari yetkazib berish xizmati Toshkent",
            tender_category="construction",
            company_categories=["construction"],
            tender_region="tashkent_city",
            company_regions=["tashkent_city"],
            tender_amount=100_000_000,
            company_min_amount=50_000_000,
            company_max_amount=200_000_000,
        )
        assert scores["total_score"] >= 65.0
        assert scores["text_score"] > 0

    async def test_low_text_similarity(self, matching_service):
        scores = await matching_service.calculate_score(
            tender_text="tibbiy jihozlar xaridi",
            company_text="dasturlash va IT xizmatlari",
            tender_category="medical",
            company_categories=["it"],
            tender_region="tashkent_city",
            company_regions=["samarkand"],
            tender_amount=100_000_000,
            company_min_amount=50_000_000,
            company_max_amount=200_000_000,
        )
        assert scores["total_score"] < 65.0

    async def test_category_match_boosts_score(self, matching_service):
        with_match = await matching_service.calculate_score(
            tender_text="loyiha",
            company_text="loyiha",
            tender_category="it",
            company_categories=["it"],
            tender_region=None,
            company_regions=None,
            tender_amount=None,
            company_min_amount=None,
            company_max_amount=None,
        )
        without_match = await matching_service.calculate_score(
            tender_text="loyiha",
            company_text="loyiha",
            tender_category="it",
            company_categories=["construction"],
            tender_region=None,
            company_regions=None,
            tender_amount=None,
            company_min_amount=None,
            company_max_amount=None,
        )
        assert with_match["category_score"] > without_match["category_score"]

    async def test_region_match_boosts_score(self, matching_service):
        with_match = await matching_service.calculate_score(
            tender_text="test",
            company_text="test",
            tender_category=None,
            company_categories=None,
            tender_region="tashkent_city",
            company_regions=["tashkent_city"],
            tender_amount=None,
            company_min_amount=None,
            company_max_amount=None,
        )
        assert with_match["region_score"] == 100.0

    async def test_amount_in_range(self, matching_service):
        scores = await matching_service.calculate_score(
            tender_text="test",
            company_text="test",
            tender_category=None,
            company_categories=None,
            tender_region=None,
            company_regions=None,
            tender_amount=100_000_000,
            company_min_amount=50_000_000,
            company_max_amount=200_000_000,
        )
        assert scores["amount_score"] == 100.0

    async def test_amount_out_of_range(self, matching_service):
        scores = await matching_service.calculate_score(
            tender_text="test",
            company_text="test",
            tender_category=None,
            company_categories=None,
            tender_region=None,
            company_regions=None,
            tender_amount=1_000_000_000,
            company_min_amount=50_000_000,
            company_max_amount=200_000_000,
        )
        assert scores["amount_score"] == 20.0

    async def test_uzbek_text_preprocessing(self, matching_service):
        scores = await matching_service.calculate_score(
            tender_text="O'zbekiston Respublikasi qurilish vazirligi loyihasi",
            company_text="qurilish loyiha boshqaruv xizmatlari",
            tender_category="construction",
            company_categories=["construction"],
            tender_region=None,
            company_regions=None,
            tender_amount=None,
            company_min_amount=None,
            company_max_amount=None,
        )
        assert scores["text_score"] > 0

    async def test_empty_texts(self, matching_service):
        scores = await matching_service.calculate_score(
            tender_text="",
            company_text="",
            tender_category=None,
            company_categories=None,
            tender_region=None,
            company_regions=None,
            tender_amount=None,
            company_min_amount=None,
            company_max_amount=None,
        )
        assert scores["text_score"] == 0.0
