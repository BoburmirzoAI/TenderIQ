"""Authentication request and response schemas."""

import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    """New user registration payload."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    phone: str | None = None


class LoginRequest(BaseModel):
    """User login payload."""

    email: EmailStr
    password: str = Field(max_length=128)


class UzexRegisterRequest(BaseModel):
    """UZEX-style registration with organization details."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str = Field(min_length=9, max_length=20)
    inn: str = Field(min_length=9, max_length=20)
    mfo: str = Field(min_length=5, max_length=10)
    organization_name: str = Field(min_length=2, max_length=500)
    account_number: str = Field(min_length=10, max_length=30)
    region: str = Field(min_length=2, max_length=100)
    district: str = Field(min_length=2, max_length=100)
    address: str = Field(min_length=2, max_length=500)
    director_name: str = Field(min_length=2, max_length=255)
    eri_key_serial: str | None = Field(None, max_length=100)
    usb_token_id: str | None = Field(None, max_length=100)
    accept_terms: bool

    @field_validator("inn")
    @classmethod
    def validate_inn(cls, v: str) -> str:
        if not re.match(r"^\d{9,14}$", v):
            raise ValueError("INN faqat raqamlardan iborat bo'lishi kerak (9-14 ta)")
        return v

    @field_validator("mfo")
    @classmethod
    def validate_mfo(cls, v: str) -> str:
        if not re.match(r"^\d{5}$", v):
            raise ValueError("MFO 5 ta raqamdan iborat bo'lishi kerak")
        return v

    @field_validator("account_number")
    @classmethod
    def validate_account_number(cls, v: str) -> str:
        if not re.match(r"^\d{10,25}$", v):
            raise ValueError("Hisob raqami faqat raqamlardan iborat bo'lishi kerak (10-25 ta)")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-()]", "", v)
        if not re.match(r"^\+?998\d{9}$", cleaned):
            raise ValueError("Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak")
        return cleaned

    @field_validator("accept_terms")
    @classmethod
    def must_accept_terms(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Oferta shartlarini qabul qilish majburiy")
        return v


class UzexLoginRequest(BaseModel):
    """UZEX-style login: INN + password or ERI key."""

    inn: str | None = Field(None, max_length=20)
    password: str | None = Field(None, max_length=128)
    eri_key_serial: str | None = Field(None, max_length=100)
    usb_token_id: str | None = Field(None, max_length=100)

    @field_validator("inn")
    @classmethod
    def validate_inn(cls, v: str | None) -> str | None:
        if v is not None and not re.match(r"^\d{9,14}$", v):
            raise ValueError("INN faqat raqamlardan iborat bo'lishi kerak (9-14 ta)")
        return v


class TokenResponse(BaseModel):
    """JWT token pair response."""

    model_config = ConfigDict(from_attributes=True)

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    """Token refresh payload."""

    refresh_token: str


class ChangePasswordRequest(BaseModel):
    """Password change payload."""

    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class VerifyEmailRequest(BaseModel):
    token: str
