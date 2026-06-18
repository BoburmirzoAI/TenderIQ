"""Authentication request and response schemas."""

from pydantic import BaseModel, ConfigDict, EmailStr, Field


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
