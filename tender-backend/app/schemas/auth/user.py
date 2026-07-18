"""User schemas for CRUD operations."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
import re


class UserCreate(BaseModel):
    """Internal user creation schema."""

    email: EmailStr
    hashed_password: str
    full_name: str
    phone: str | None = None
    telegram_id: str | None = None


class UserRead(BaseModel):
    """User data returned in API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    is_admin: bool = False
    is_superadmin: bool = False
    is_verified: bool
    telegram_id: Optional[str] = None
    telegram_username: Optional[str] = None
    language: str
    notify_new_tenders: bool = True
    notify_match: bool = True
    notify_deadline: bool = True
    notify_results: bool = True
    notify_email: bool = False
    notify_telegram: bool = True
    theme: str = "system"
    created_at: datetime

    # UZEX fields
    auth_type: str = "basic"
    inn: Optional[str] = None
    organization_name: Optional[str] = None
    region: Optional[str] = None
    district: Optional[str] = None
    director_name: Optional[str] = None


class UserUpdate(BaseModel):
    """Fields allowed for user self-update."""

    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    telegram_username: Optional[str] = Field(None, max_length=64)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is not None and not re.match(r"^\+?[0-9\s\-()]{7,20}$", v):
            raise ValueError("Telefon raqam formati noto'g'ri")
        return v
    language: Optional[Literal["uz", "ru", "en"]] = None
    avatar_url: Optional[str] = Field(None, max_length=500)
    notify_new_tenders: Optional[bool] = None
    notify_match: Optional[bool] = None
    notify_deadline: Optional[bool] = None
    notify_results: Optional[bool] = None
    notify_email: Optional[bool] = None
    notify_telegram: Optional[bool] = None
    theme: Optional[Literal["light", "dark", "system"]] = None


class UserProfile(BaseModel):
    """Extended user profile including subscription info."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    is_verified: bool
    telegram_id: Optional[str] = None
    language: str
    current_plan: str = "free"
    company_name: Optional[str] = None
    created_at: datetime
