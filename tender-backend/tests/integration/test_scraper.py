"""Integration tests for scraper cleaner and parser."""

import pytest

from app.scraper.core.cleaner import clean_amount, clean_category, clean_date, clean_region
from app.scraper.core.parser import parse_tender_html


class TestParserWithHTML:
    """Test HTML parsing with table fixtures."""

    def test_parse_empty_html(self):
        result = parse_tender_html("<html></html>")
        assert result == []

    def test_parse_table_html(self):
        html = """
        <table>
        <tr><th>Title</th><th>Org</th><th>Amount</th></tr>
        <tr><td><a href="/tender/123">Test Tender</a></td><td>Test Org</td><td>100,000,000</td></tr>
        </table>
        """
        result = parse_tender_html(html)
        assert len(result) == 1
        assert result[0]["title"] == "Test Tender"

    def test_parse_json_response(self):
        json_str = '[{"id": 1, "title": "Test"}]'
        result = parse_tender_html(json_str)
        assert len(result) == 1

    def test_parse_json_dict_with_data(self):
        json_str = '{"data": [{"id": 1, "title": "Test"}]}'
        result = parse_tender_html(json_str)
        assert len(result) == 1


class TestCleanerIntegration:
    """Test cleaner functions with realistic inputs."""

    def test_real_amount_format(self):
        assert clean_amount("1 234 567 890,00 UZS") == 1234567890.0

    def test_real_date_format(self):
        dt = clean_date("2024-03-15T10:30:00")
        assert dt is not None
        assert dt.hour == 10

    def test_real_category_mapping(self):
        assert clean_category("Qurilish va ta'mirlash ishlari") == "construction"
        assert clean_category("Axborot texnologiyalari") == "it"

    def test_real_region_mapping(self):
        assert clean_region("Toshkent shahri") == "tashkent_city"
        assert clean_region("Наманган вилояти") == "namangan"
