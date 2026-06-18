"""Team workspace schemas."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

TEAM_ROLES = Literal["owner", "admin", "member", "viewer"]


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)


class MemberAdd(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    role: TEAM_ROLES = "member"


class MemberUpdateRole(BaseModel):
    role: TEAM_ROLES


class TeamMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    role: str
    user_name: str = ""
    user_email: str = ""
    created_at: datetime


class TeamRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    company_id: int
    owner_id: int
    max_members: int
    members_count: int = 0
    members: list[TeamMemberRead] = []
    created_at: datetime
