"""Unit tests for scraper parser and cleaner."""

import pytest

from app.scraper.core.cleaner import clean_amount, clean_category, clean_date, clean_region
from app.scraper.core.deduplicator import deduplicate_tenders, is_duplicate_by_title


class TestCleanAmount:
    """Tests for amount parsing."""

    def test_clean_simple_number(self):
        assert clean_amount("100000000") == 100_000_000

    def test_clean_with_commas(self):
        assert clean_amount("100,000,000") == 100_000_000

    def test_clean_with_currency(self):
        assert clean_amount("100 000 000 UZS") == 100_000_000

    def test_clean_empty(self):
        assert clean_amount("") is None

    def test_clean_with_dots(self):
        assert clean_amount("100.50") == 100.50


class TestCleanDate:
    """Tests for date parsing."""

    def test_iso_format(self):
        dt = clean_date("2024-01-15")
        assert dt is not None
        assert dt.day == 15
        assert dt.month == 1

    def test_dot_format(self):
        dt = clean_date("15.01.2024")
        assert dt is not None
        assert dt.day == 15

    def test_empty_date(self):
        assert clean_date("") is None

    def test_invalid_date(self):
        assert clean_date("not a date") is None


class TestCleanCategory:
    """Tests for category mapping."""

    def test_uzbek_construction(self):
        assert clean_category("qurilish ishlari") == "construction"

    def test_russian_medical(self):
        assert clean_category("медицинское оборудование") == "medical"

    def test_unknown_category(self):
        assert clean_category("random text") == "other"

    def test_empty_category(self):
        assert clean_category("") == "other"


class TestCleanRegion:
    """Tests for region mapping."""

    def test_tashkent_city(self):
        assert clean_region("Toshkent shahri") == "tashkent_city"

    def test_samarkand_russian(self):
        assert clean_region("Самарканд") == "samarkand"

    def test_unknown_region(self):
        assert clean_region("Unknown") is None


class TestDeduplication:
    """Tests for tender deduplication."""

    def test_deduplicate_by_external_id(self):
        tenders = [
            {"external_id": "1", "title": "A"},
            {"external_id": "2", "title": "B"},
        ]
        result = deduplicate_tenders(tenders, {"1"})
        assert len(result) == 1
        assert result[0]["external_id"] == "2"

    def test_duplicate_title_detection(self):
        assert is_duplicate_by_title(
            "qurilish materiallari xaridi",
            ["qurilish materiallari xaridi Toshkent"],
            threshold=0.7,
        )
