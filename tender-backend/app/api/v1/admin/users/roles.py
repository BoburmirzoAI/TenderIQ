"""Admin RBAC — roles, permissions, user-role assignments."""

import json
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import delete, insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.exceptions import NotFoundException
from app.models.system.audit_log import AuditLog
from app.models.auth.role import Permission, Role, role_permissions, user_roles
from app.models.auth.user import User
from app.repositories.auth.user_repo import UserRepository
from app.schemas.base import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class PermissionRead(BaseModel):
    id: int
    name: str
    resource: str
    action: str
    description: Optional[str] = None
    is_system: bool
    model_config = {"from_attributes": True}


class RoleRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_system: bool
    permissions: List[PermissionRead] = []
    user_count: int = 0
    model_config = {"from_attributes": True}


class RoleCreate(BaseModel):
    name: str
    description: str = ""
    permission_ids: List[int] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None


class PermissionCreate(BaseModel):
    name: str
    resource: str
    action: str
    description: str = ""


class AssignRoleRequest(BaseModel):
    role_ids: List[int]


class AdminPromoteRequest(BaseModel):
    email: EmailStr
    reason: str = ""


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_role_or_404(role_id: int, db: AsyncSession) -> Role:
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise NotFoundException("Role", str(role_id))
    return role


async def _count_role_users(role_id: int, db: AsyncSession) -> int:
    result = await db.execute(
        select(user_roles.c.user_id).where(user_roles.c.role_id == role_id)
    )
    return len(result.fetchall())


async def _role_to_read(role: Role, db: AsyncSession) -> RoleRead:
    count = await _count_role_users(role.id, db)
    perms = []
    # load permissions if not already loaded
    result = await db.execute(
        select(Permission).join(role_permissions, Permission.id == role_permissions.c.permission_id)
        .where(role_permissions.c.role_id == role.id)
    )
    for p in result.scalars().all():
        perms.append(PermissionRead.model_validate(p))
    return RoleRead(
        id=role.id,
        name=role.name,
        description=role.description,
        is_system=role.is_system,
        permissions=perms,
        user_count=count,
    )


# ── Permission endpoints ──────────────────────────────────────────────────────

@router.get("/permissions", response_model=SuccessResponse[List[PermissionRead]])
async def list_permissions(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Permission).order_by(Permission.resource, Permission.action))
    perms = [PermissionRead.model_validate(p) for p in result.scalars().all()]
    return SuccessResponse(data=perms)


@router.post("/permissions", response_model=SuccessResponse[PermissionRead])
async def create_permission(
    data: PermissionCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not admin.is_superadmin:
        raise HTTPException(status_code=403, detail="Faqat superadmin permission yarata oladi")

    existing = await db.execute(select(Permission).where(Permission.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"'{data.name}' permission allaqachon mavjud")

    perm = Permission(
        name=data.name, resource=data.resource,
        action=data.action, description=data.description, is_system=False,
    )
    db.add(perm)
    await db.commit()
    await db.refresh(perm)
    return SuccessResponse(data=PermissionRead.model_validate(perm))


@router.delete("/permissions/{permission_id}", response_model=SuccessResponse[dict])
async def delete_permission(
    permission_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not admin.is_superadmin:
        raise HTTPException(status_code=403, detail="Faqat superadmin permission o'chira oladi")

    result = await db.execute(select(Permission).where(Permission.id == permission_id))
    perm = result.scalar_one_or_none()
    if not perm:
        raise NotFoundException("Permission", str(permission_id))
    if perm.is_system:
        raise HTTPException(status_code=400, detail="Tizim permissionlarini o'chirib bo'lmaydi")

    await db.delete(perm)
    await db.commit()
    return SuccessResponse(data={"deleted": True})


# ── Role endpoints ────────────────────────────────────────────────────────────

@router.get("", response_model=SuccessResponse[List[RoleRead]])
async def list_roles(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Role).order_by(Role.id))
    roles = result.scalars().all()
    data = [await _role_to_read(r, db) for r in roles]
    return SuccessResponse(data=data)


@router.post("", response_model=SuccessResponse[RoleRead])
async def create_role(
    data: RoleCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not admin.is_superadmin:
        raise HTTPException(status_code=403, detail="Faqat superadmin rol yarata oladi")

    existing = await db.execute(select(Role).where(Role.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"'{data.name}' roli allaqachon mavjud")

    role = Role(name=data.name, description=data.description, is_system=False)
    db.add(role)
    await db.flush()

    for pid in data.permission_ids:
        await db.execute(insert(role_permissions).values(role_id=role.id, permission_id=pid))

    db.add(AuditLog(user_id=admin.id, action="role_created", resource_type="role",
                    resource_id=role.id, details=json.dumps({"name": data.name})))
    await db.commit()
    await db.refresh(role)
    return SuccessResponse(data=await _role_to_read(role, db))


@router.get("/{role_id}", response_model=SuccessResponse[RoleRead])
async def get_role(
    role_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    role = await _get_role_or_404(role_id, db)
    return SuccessResponse(data=await _role_to_read(role, db))


@router.patch("/{role_id}", response_model=SuccessResponse[RoleRead])
async def update_role(
    role_id: int,
    data: RoleUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not admin.is_superadmin:
        raise HTTPException(status_code=403, detail="Faqat superadmin rolni tahrirlaya oladi")

    role = await _get_role_or_404(role_id, db)
    if role.is_system and data.name and data.name != role.name:
        raise HTTPException(status_code=400, detail="Tizim rolining nomini o'zgartirib bo'lmaydi")

    if data.name is not None:
        role.name = data.name
    if data.description is not None:
        role.description = data.description

    if data.permission_ids is not None:
        await db.execute(delete(role_permissions).where(role_permissions.c.role_id == role_id))
        for pid in data.permission_ids:
            await db.execute(insert(role_permissions).values(role_id=role_id, permission_id=pid))

    db.add(AuditLog(user_id=admin.id, action="role_updated", resource_type="role",
                    resource_id=role_id, details=json.dumps({"name": role.name})))
    await db.commit()
    await db.refresh(role)
    return SuccessResponse(data=await _role_to_read(role, db))


@router.delete("/{role_id}", response_model=SuccessResponse[dict])
async def delete_role(
    role_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not admin.is_superadmin:
        raise HTTPException(status_code=403, detail="Faqat superadmin rolni o'chira oladi")

    role = await _get_role_or_404(role_id, db)
    if role.is_system:
        raise HTTPException(status_code=400, detail="Tizim rollarini o'chirib bo'lmaydi")

    await db.delete(role)
    db.add(AuditLog(user_id=admin.id, action="role_deleted", resource_type="role",
                    resource_id=role_id, details=json.dumps({"name": role.name})))
    await db.commit()
    return SuccessResponse(data={"deleted": True})


# ── User-role assignment ──────────────────────────────────────────────────────

@router.get("/users/{user_id}/roles", response_model=SuccessResponse[List[RoleRead]])
async def get_user_roles(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Role).join(user_roles, Role.id == user_roles.c.role_id)
        .where(user_roles.c.user_id == user_id)
    )
    roles = result.scalars().all()
    data = [await _role_to_read(r, db) for r in roles]
    return SuccessResponse(data=data)


@router.put("/users/{user_id}/roles", response_model=SuccessResponse[dict])
async def assign_user_roles(
    user_id: int,
    data: AssignRoleRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not admin.is_superadmin:
        raise HTTPException(status_code=403, detail="Faqat superadmin rol tayinlay oladi")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise NotFoundException("User", str(user_id))

    await db.execute(delete(user_roles).where(user_roles.c.user_id == user_id))
    for rid in data.role_ids:
        await db.execute(insert(user_roles).values(user_id=user_id, role_id=rid))

    db.add(AuditLog(user_id=admin.id, action="user_roles_updated", resource_type="user",
                    resource_id=user_id, details=json.dumps({"role_ids": data.role_ids})))
    await db.commit()
    return SuccessResponse(data={"updated": True, "role_ids": data.role_ids})


# ── Admin list (legacy, kept for sidebar) ────────────────────────────────────

class AdminUserRead(BaseModel):
    id: int
    email: str
    full_name: str
    is_admin: bool
    is_superadmin: bool
    is_active: bool
    created_at: str
    model_config = {"from_attributes": True}


@router.get("/admins/list", response_model=SuccessResponse[List[AdminUserRead]])
async def list_admins(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.is_admin.is_(True)).order_by(User.id)
    )
    admins = result.scalars().all()
    data = [
        AdminUserRead(
            id=u.id, email=u.email, full_name=u.full_name,
            is_admin=u.is_admin, is_superadmin=u.is_superadmin,
            is_active=u.is_active, created_at=str(u.created_at),
        )
        for u in admins
    ]
    return SuccessResponse(data=data)


@router.post("/admins/promote", response_model=SuccessResponse[dict])
async def promote_to_admin(
    data: AdminPromoteRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not admin.is_superadmin:
        raise HTTPException(status_code=403, detail="Faqat superadmin boshqa adminlarni tayinlay oladi")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(data.email)
    if not user:
        raise NotFoundException("User", data.email)
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Bu foydalanuvchi allaqachon admin")

    await user_repo.update(user.id, {"is_admin": True})
    db.add(AuditLog(user_id=admin.id, action="admin_promoted", resource_type="user",
                    resource_id=user.id, details=json.dumps({"email": data.email, "reason": data.reason})))
    await db.commit()
    return SuccessResponse(data={"promoted": True, "user_id": user.id})


@router.delete("/admins/{user_id}/demote", response_model=SuccessResponse[dict])
async def demote_from_admin(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not admin.is_superadmin:
        raise HTTPException(status_code=403, detail="Faqat superadmin adminni o'chira oladi")
    if user_id == admin.id:
        raise HTTPException(status_code=403, detail="O'zingizni admin huquqidan mahrum eta olmaysiz")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise NotFoundException("User", str(user_id))
    if user.is_superadmin:
        raise HTTPException(status_code=403, detail="Superadmin statusini o'chirish mumkin emas")

    await user_repo.update(user_id, {"is_admin": False})
    db.add(AuditLog(user_id=admin.id, action="admin_demoted", resource_type="user", resource_id=user_id))
    await db.commit()
    return SuccessResponse(data={"demoted": True})
