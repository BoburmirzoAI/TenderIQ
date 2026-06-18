"""Date and time utility functions."""

from datetime import datetime, timezone
from typing import Optional

UZBEK_MONTH_NAMES = {
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


def days_until(target: Optional[datetime]) -> Optional[int]:
    """Calculate days remaining until a target date."""
    if not target:
        return None
    delta = target - datetime.now(timezone.utc)
    return max(0, delta.days)


def is_expired(dt: Optional[datetime]) -> bool:
    """Check if a datetime has passed."""
    if not dt:
        return False
    return datetime.now(timezone.utc) > dt


def uzbek_month_name(month: int) -> str:
    """Return the Uzbek month name for a month number."""
    return UZBEK_MONTH_NAMES.get(month, str(month))


def deadline_urgency(deadline: Optional[datetime]) -> str:
    """Classify deadline urgency level."""
    remaining = days_until(deadline)
    if remaining is None:
        return "unknown"
    if remaining <= 0:
        return "expired"
    if remaining <= 2:
        return "critical"
    if remaining <= 7:
        return "urgent"
    return "normal"
