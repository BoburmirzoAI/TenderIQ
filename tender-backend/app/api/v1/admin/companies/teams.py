"""Admin teams — view and manage workspace teams."""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.companies.team import Team, TeamMember
from app.models.companies.company import Company
from app.models.auth.user import User
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class MemberRead(BaseModel):
    id: int
    user_id: int
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str
    joined: str


class TeamRead(BaseModel):
    id: int
    name: str
    company_id: int
    company_name: Optional[str] = None
    owner_id: int
    owner_email: Optional[str] = None
    owner_name: Optional[str] = None
    max_members: int
    member_count: int
    members: List[MemberRead] = []
    created_at: str


class TeamStats(BaseModel):
    total_teams: int
    total_members: int
    avg_members: float


# ── Helpers ───────────────────────────────────────────────────────────────────

def _member_read(tm: TeamMember) -> MemberRead:
    u = tm.user
    return MemberRead(
        id=tm.id,
        user_id=tm.user_id,
        email=u.email if u else None,
        full_name=u.full_name if u else None,
        role=tm.role,
        joined=str(tm.created_at)[:10],
    )


def _team_read(team: Team) -> TeamRead:
    return TeamRead(
        id=team.id,
        name=team.name,
        company_id=team.company_id,
        company_name=team.company.name if team.company else None,
        owner_id=team.owner_id,
        owner_email=team.owner.email if team.owner else None,
        owner_name=team.owner.full_name if team.owner else None,
        max_members=team.max_members,
        member_count=len(team.members),
        members=[_member_read(m) for m in team.members],
        created_at=str(team.created_at)[:10],
    )


class AdminTeamCreate(BaseModel):
    name: str
    company_id: int
    owner_id: int
    max_members: int = 5


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("", response_model=SuccessResponse[TeamRead])
async def create_team(
    data: AdminTeamCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    company = (await db.execute(select(Company).where(Company.id == data.company_id))).scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Kompaniya topilmadi")
    owner = (await db.execute(select(User).where(User.id == data.owner_id))).scalar_one_or_none()
    if not owner:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    team = Team(name=data.name, company_id=data.company_id, owner_id=data.owner_id, max_members=data.max_members)
    db.add(team)
    await db.commit()
    await db.refresh(team)
    return SuccessResponse(data=_team_read(team))


@router.get("", response_model=SuccessResponse[List[TeamRead]])
async def list_teams(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Team).order_by(Team.created_at.desc()))
    return SuccessResponse(data=[_team_read(t) for t in result.scalars().all()])


@router.get("/stats", response_model=SuccessResponse[TeamStats])
async def team_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    total_teams = (await db.execute(select(func.count(Team.id)))).scalar_one()
    total_members = (await db.execute(select(func.count(TeamMember.id)))).scalar_one()
    avg = round(total_members / total_teams, 1) if total_teams else 0.0
    return SuccessResponse(data=TeamStats(
        total_teams=total_teams,
        total_members=total_members,
        avg_members=avg,
    ))


@router.get("/{team_id}", response_model=SuccessResponse[TeamRead])
async def get_team(
    team_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Jamoa topilmadi")
    return SuccessResponse(data=_team_read(team))


@router.get("/{team_id}/members", response_model=SuccessResponse[List[MemberRead]])
async def get_team_members(
    team_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Jamoa topilmadi")
    members_result = await db.execute(
        select(TeamMember).where(TeamMember.team_id == team_id)
    )
    members = members_result.scalars().all()
    return SuccessResponse(data=[_member_read(m) for m in members])


@router.patch("/{team_id}", response_model=SuccessResponse[TeamRead])
async def update_team(
    team_id: int,
    data: dict,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Jamoa topilmadi")
    allowed = {"name", "max_members"}
    for k, v in data.items():
        if k in allowed:
            setattr(team, k, v)
    await db.commit()
    await db.refresh(team)
    return SuccessResponse(data=_team_read(team))


@router.delete("/{team_id}", response_model=SuccessResponse[dict])
async def delete_team(
    team_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Jamoa topilmadi")
    await db.delete(team)
    await db.commit()
    return SuccessResponse(data={"deleted": True})


@router.delete("/{team_id}/members/{member_id}", response_model=SuccessResponse[dict])
async def remove_member(
    team_id: int,
    member_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TeamMember).where(TeamMember.id == member_id, TeamMember.team_id == team_id)
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="A'zo topilmadi")
    await db.delete(member)
    await db.commit()
    return SuccessResponse(data={"deleted": True})
