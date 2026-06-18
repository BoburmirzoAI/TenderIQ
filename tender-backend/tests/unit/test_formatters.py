"""Unit tests for formatters."""

from datetime import datetime

from app.utils.formatters import format_date, format_money, format_percentage


class TestFormatMoney:
    def test_millions(self):
        assert "mln" in format_money(50_000_000)

    def test_billions(self):
        assert "mlrd" in format_money(1_500_000_000)

    def test_small_amount(self):
        result = format_money(50_000)
        assert "50,000 UZS" == result

    def test_custom_currency(self):
        assert "USD" in format_money(100, "USD")


class TestFormatDate:
    def test_basic_date(self):
        dt = datetime(2024, 3, 15)
        result = format_date(dt)
        assert "15" in result
        assert "mart" in result

    def test_with_time(self):
        dt = datetime(2024, 3, 15, 10, 30)
        result = format_date(dt, include_time=True)
        assert "10:30" in result

    def test_none_date(self):
        assert format_date(None) == "—"


class TestFormatPercentage:
    def test_basic(self):
        assert format_percentage(85.5) == "85.5%"

    def test_zero_decimals(self):
        assert format_percentage(85.0, decimals=0) == "85%"
