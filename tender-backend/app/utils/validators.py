"""Input validators for Uzbekistan-specific data."""

import re

from app.exceptions import ValidationException


def validate_stir(stir: str) -> bool:
    """Validate Uzbekistan STIR (tax identification number) — 9 digits."""
    if not re.match(r"^\d{9}$", stir):
        raise ValidationException("STIR must be exactly 9 digits")
    return True


def validate_phone_uz(phone: str) -> bool:
    """Validate Uzbekistan phone number format."""
    cleaned = re.sub(r"[\s\-\(\)]", "", phone)
    if not re.match(r"^(\+998|998)?\d{9}$", cleaned):
        raise ValidationException(
            "Phone must be a valid Uzbekistan number (e.g., +998901234567)"
        )
    return True


def validate_amount_range(min_amount: float | None, max_amount: float | None) -> bool:
    """Validate that amount range is logically correct."""
    if min_amount is not None and min_amount < 0:
        raise ValidationException("Minimum amount cannot be negative")
    if max_amount is not None and max_amount < 0:
        raise ValidationException("Maximum amount cannot be negative")
    if min_amount is not None and max_amount is not None and min_amount > max_amount:
        raise ValidationException("Minimum amount cannot exceed maximum amount")
    return True
