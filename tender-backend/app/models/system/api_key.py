"""API key model for programmatic access."""

import secrets

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text

from app.models.base import BaseModel


class APIKey(BaseModel):
    __tablename__ = "api_keys"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    key_hash = Column(String(64), unique=True, nullable=False, index=True)
    key_prefix = Column(String(12), nullable=False)
    scopes = Column(Text, nullable=True)       # JSON list of scope strings
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    @staticmethod
    def generate() -> tuple[str, str, str]:
        """Return (full_key, prefix, hash) — store only prefix+hash."""
        import hashlib
        raw = "tiq_" + secrets.token_urlsafe(32)
        prefix = raw[:12]
        key_hash = hashlib.sha256(raw.encode()).hexdigest()
        return raw, prefix, key_hash
