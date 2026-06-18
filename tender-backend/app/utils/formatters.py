"""Formatting utilities for money, dates, and percentages."""

from datetime import datetime
from typing import Optional

UZBEK_MONTHS = {
    1: "yanvar",
    2: "fevral",
    3: "mart",
    4: "aprel",
    5: "may",
    6: "iyun",
    7: "iyul",
    8: "avgust",
    9: "sentabr",
    10: "oktabr",
    11: "noyabr",
    12: "dekabr",
}


def format_money(amount: float, currency: str = "UZS") -> str:
    """Format amount as Uzbek currency string."""
    if amount >= 1_000_000_000:
        return f"{amount / 1_000_000_000:,.1f} mlrd {currency}"
    if amount >= 1_000_000:
        return f"{amount / 1_000_000:,.1f} mln {currency}"
    return f"{amount:,.0f} {currency}"


def format_date(dt: Optional[datetime], include_time: bool = False) -> str:
    """Format datetime in Uzbek style."""
    if not dt:
        return "—"
    month_name = UZBEK_MONTHS.get(dt.month, str(dt.month))
    date_str = f"{dt.day} {month_name} {dt.year}"
    if include_time:
        date_str += f" {dt.hour:02d}:{dt.minute:02d}"
    return date_str


def format_percentage(value: float, decimals: int = 1) -> str:
    """Format a number as percentage string."""
    return f"{value:.{decimals}f}%"
