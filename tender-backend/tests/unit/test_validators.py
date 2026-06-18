"""Unit tests for validators."""

import pytest

from app.exceptions import ValidationException
from app.utils.validators import validate_amount_range, validate_phone_uz, validate_stir


class TestValidateStir:
    def test_valid_stir(self):
        assert validate_stir("123456789") is True

    def test_short_stir(self):
        with pytest.raises(ValidationException):
            validate_stir("12345")

    def test_non_numeric_stir(self):
        with pytest.raises(ValidationException):
            validate_stir("12345678a")


class TestValidatePhone:
    def test_valid_phone(self):
        assert validate_phone_uz("+998901234567") is True

    def test_valid_without_plus(self):
        assert validate_phone_uz("998901234567") is True

    def test_invalid_phone(self):
        with pytest.raises(ValidationException):
            validate_phone_uz("12345")


class TestValidateAmountRange:
    def test_valid_range(self):
        assert validate_amount_range(100, 200) is True

    def test_negative_min(self):
        with pytest.raises(ValidationException):
            validate_amount_range(-100, 200)

    def test_min_exceeds_max(self):
        with pytest.raises(ValidationException):
            validate_amount_range(300, 200)

    def test_none_values(self):
        assert validate_amount_range(None, None) is True
