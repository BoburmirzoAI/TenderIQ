"""Team workspace endpoints with strict role-based access control.

Roles hierarchy: owner > admin > member > viewer
- owner: full control, can delete team, manage all members
- admin: can add/remove members (not owner/admin), update team
- member: can view team, see shared data
- viewer: read-only access

Superadmin/admin bypass: system admins can access any team.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.team import Team, TeamMember
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.base import SuccessResponse
from app.schemas.team import (
    MemberAdd,
    MemberUpdateRole,
    TeamCreate,
    TeamMemberRead,
    TeamRead,
    TeamUpdate,
)

router = APIRouter()

ROLE_HIERARCHY = {"owner": 4, "admin": 3, "member": 2, "viewer": 1}


def _check_role(member: TeamMember | None, user: User, min_role: str) -> None:
    """Check if user has at least the minimum required role. System admins bypass."""
    if user.is_admin or user.is_superadmin:
        return
    if not member:
        raise HTTPException(status_code=403, detail="Siz bu jamoaning a'zosi emassiz")
    if ROLE_HIERARCHY.get(member.role, 0) < ROLE_HIERARCHY.get(min_role, 0):
        raise HTTPException(status_code=403, detail="Sizda yetarli huquq yo'q")


async def _get_membership(db: AsyncSession, team_id: int, user_id: int) -> TeamMember | None:
    result = await db.execute(
        select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
    )
    return result.scalar_one_or_none()


def _team_to_read(team: Team) -> TeamRead:
    members = [
        TeamMemberRead(
            id=m.id,
            user_id=m.user_id,
            role=m.role,
            user_name=m.user.full_name if m.user else "",
            user_email=m.user.email if m.user else "",
            created_at=m.created_at,
        )
        for m in (team.members or [])
    ]
    return TeamRead(
        id=team.id,
        name=team.name,
        company_id=team.company_id,
        owner_id=team.owner_id,
        max_members=team.max_members,
        members_count=len(members),
        members=members,
        created_at=team.created_at,
    )


@router.post("/", response_model=SuccessResponse[TeamRead])
async def create_team(
    body: TeamCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new team. Requires a company profile."""
    if not user.company:
        raise HTTPException(status_code=400, detail="Avval kompaniya profili yarating")

    existing_count = (
        await db.execute(
            select(func.count()).select_from(Team).where(Team.owner_id == user.id)
        )
    ).scalar_one()
    if existing_count >= 3 and not (user.is_admin or user.is_superadmin):
        raise HTTPException(status_code=400, detail="Maksimum 3 ta jamoa yaratish mumkin")

    team = Team(
        name=body.name,
        company_id=user.company.id,
        owner_id=user.id,
    )
    db.add(team)
    await db.flush()

    owner_member = TeamMember(team_id=team.id, user_id=user.id, role="owner")
    db.add(owner_member)
    await db.commit()
    await db.refresh(team)

    return SuccessResponse(data=_team_to_read(team))


@router.get("/my", response_model=SuccessResponse[list[TeamRead]])
async def my_teams(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List teams the current user belongs to."""
    result = await db.execute(
        select(Team)
        .join(TeamMember, TeamMember.team_id == Team.id)
        .where(TeamMember.user_id == user.id)
        .order_by(Team.created_at.desc())
    )
    teams = result.unique().scalars().all()
    return SuccessResponse(data=[_team_to_read(t) for t in teams])


@router.get("/{team_id}", response_model=SuccessResponse[TeamRead])
async def get_team(
    team_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get team details. Must be a member (or system admin)."""
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Jamoa topilmadi")

    membership = await _get_membership(db, team_id, user.id)
    _check_role(membership, user, "viewer")

    return SuccessResponse(data=_team_to_read(team))


@router.patch("/{team_id}", response_model=SuccessResponse[TeamRead])
async def update_team(
    team_id: int,
    body: TeamUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update team name. Requires admin+ role."""
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Jamoa topilmadi")

    membership = await _get_membership(db, team_id, user.id)
    _check_role(membership, user, "admin")

    if body.name is not None:
        team.name = body.name

    await db.commit()
    await db.refresh(team)
    return SuccessResponse(data=_team_to_read(team))


@router.delete("/{team_id}", response_model=SuccessResponse[dict])
async def delete_team(
    team_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a team. Only owner or system admin can do this."""
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Jamoa topilmadi")

    membership = await _get_membership(db, team_id, user.id)
    _check_role(membership, user, "owner")

    await db.delete(team)
    await db.commit()
    return SuccessResponse(data={"deleted": True})


@router.post("/{team_id}/members", response_model=SuccessResponse[TeamMemberRead])
async def add_member(
    team_id: int,
    body: MemberAdd,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a member to the team. Requires admin+ role."""
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Jamoa topilmadi")

    membership = await _get_membership(db, team_id, user.id)
    _check_role(membership, user, "admin")

    if body.role == "owner":
        raise HTTPException(status_code=400, detail="Owner rolini berish mumkin emas")

    if body.role == "admin" and membership and membership.role != "owner":
        if not (user.is_admin or user.is_superadmin):
            raise HTTPException(status_code=403, detail="Admin rolini faqat owner berishi mumkin")

    current_count = (
        await db.execute(
            select(func.count()).select_from(TeamMember).where(TeamMember.team_id == team_id)
        )
    ).scalar_one()
    if current_count >= team.max_members and not (user.is_admin or user.is_superadmin):
        raise HTTPException(status_code=400, detail=f"Maksimum {team.max_members} ta a'zo")

    user_repo = UserRepository(db)
    target_user = await user_repo.get_by_email(body.email)
    if not target_user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    if not target_user.is_active:
        raise HTTPException(status_code=400, detail="Foydalanuvchi faol emas")

    existing = await _get_membership(db, team_id, target_user.id)
    if existing:
        raise HTTPException(status_code=409, detail="Bu foydalanuvchi allaqachon a'zo")

    member = TeamMember(team_id=team_id, user_id=target_user.id, role=body.role)
    db.add(member)
    await db.commit()
    await db.refresh(member)

    return SuccessResponse(data=TeamMemberRead(
        id=member.id,
        user_id=member.user_id,
        role=member.role,
        user_name=target_user.full_name,
        user_email=target_user.email,
        created_at=member.created_at,
    ))


@router.patch("/{team_id}/members/{member_id}", response_model=SuccessResponse[TeamMemberRead])
async def update_member_role(
    team_id: int,
    member_id: int,
    body: MemberUpdateRole,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Change a member's role. Owner can change anyone, admin can change member/viewer only."""
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Jamoa topilmadi")

    my_membership = await _get_membership(db, team_id, user.id)
    _check_role(my_membership, user, "admin")

    target = await db.get(TeamMember, member_id)
    if not target or target.team_id != team_id:
        raise HTTPException(status_code=404, detail="A'zo topilmadi")

    if target.role == "owner":
        raise HTTPException(status_code=403, detail="Owner rolini o'zgartirish mumkin emas")

    if body.role == "owner":
        raise HTTPException(status_code=400, detail="Owner rolini berish mumkin emas")

    if target.role == "admin" and my_membership and my_membership.role != "owner":
        if not (user.is_admin or user.is_superadmin):
            raise HTTPException(status_code=403, detail="Admin rolini faqat owner o'zgartira oladi")

    if body.role == "admin" and my_membership and my_membership.role != "owner":
        if not (user.is_admin or user.is_superadmin):
            raise HTTPException(status_code=403, detail="Admin rolini faqat owner berishi mumkin")

    target.role = body.role
    await db.commit()
    await db.refresh(target)

    return SuccessResponse(data=TeamMemberRead(
        id=target.id,
        user_id=target.user_id,
        role=target.role,
        user_name=target.user.full_name if target.user else "",
        user_email=target.user.email if target.user else "",
        created_at=target.created_at,
    ))


@router.delete("/{team_id}/members/{member_id}", response_model=SuccessResponse[dict])
async def remove_member(
    team_id: int,
    member_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member from the team. Admin+ can remove, members can remove themselves."""
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Jamoa topilmadi")

    target = await db.get(TeamMember, member_id)
    if not target or target.team_id != team_id:
        raise HTTPException(status_code=404, detail="A'zo topilmadi")

    if target.role == "owner":
        raise HTTPException(status_code=403, detail="Ownerni olib tashlash mumkin emas")

    is_self = target.user_id == user.id
    if not is_self:
        my_membership = await _get_membership(db, team_id, user.id)
        _check_role(my_membership, user, "admin")

        if target.role == "admin" and my_membership and my_membership.role != "owner":
            if not (user.is_admin or user.is_superadmin):
                raise HTTPException(status_code=403, detail="Adminni faqat owner olib tashlashi mumkin")

    await db.delete(target)
    await db.commit()
    return SuccessResponse(data={"removed": True})
