"""Seed default RBAC roles and permissions."""

import asyncio

PERMISSIONS = [
    ("users.view",          "users",         "view",    "Foydalanuvchilarni ko'rish"),
    ("users.edit",          "users",         "edit",    "Foydalanuvchilarni tahrirlash"),
    ("users.delete",        "users",         "delete",  "Foydalanuvchilarni o'chirish"),
    ("users.message",       "users",         "message", "Foydalanuvchilarga xabar yuborish"),
    ("tenders.view",        "tenders",       "view",    "Tenderlarni ko'rish"),
    ("tenders.edit",        "tenders",       "edit",    "Tenderlarni tahrirlash"),
    ("tenders.delete",      "tenders",       "delete",  "Tenderlarni o'chirish"),
    ("companies.view",      "companies",     "view",    "Kompaniyalarni ko'rish"),
    ("companies.edit",      "companies",     "edit",    "Kompaniyalarni tahrirlash"),
    ("companies.delete",    "companies",     "delete",  "Kompaniyalarni o'chirish"),
    ("financials.view",     "financials",    "view",    "Moliyani ko'rish"),
    ("financials.manage",   "financials",    "manage",  "Moliyani boshqarish"),
    ("notifications.view",  "notifications", "view",    "Bildirishnomalarni ko'rish"),
    ("notifications.send",  "notifications", "send",    "Broadcast yuborish"),
    ("analytics.view",      "analytics",     "view",    "Analitikani ko'rish"),
    ("audit_log.view",      "audit_log",     "view",    "Audit logni ko'rish"),
    ("settings.view",       "settings",      "view",    "Sozlamalarni ko'rish"),
    ("settings.edit",       "settings",      "edit",    "Sozlamalarni tahrirlash"),
    ("roles.view",          "roles",         "view",    "Rollarni ko'rish"),
    ("roles.manage",        "roles",         "manage",  "Rollarni boshqarish"),
    ("health.view",         "health",        "view",    "Platforma holatini ko'rish"),
    ("system.view_logs",    "system",        "view_logs", "Konteyner loglarini ko'rish"),
]

ROLES = [
    ("superadmin", "To'liq kirish huquqi", True, [p[0] for p in PERMISSIONS]),
    ("admin", "Asosiy admin huquqlari", True, [
        "users.view", "users.edit", "users.delete", "users.message",
        "tenders.view", "tenders.edit", "tenders.delete",
        "companies.view", "companies.edit", "companies.delete",
        "financials.view", "financials.manage",
        "notifications.view", "notifications.send",
        "analytics.view", "audit_log.view",
        "settings.view", "roles.view", "health.view", "system.view_logs",
    ]),
    ("moderator", "Kontent moderatori", False, [
        "users.view", "users.message",
        "tenders.view", "tenders.edit",
        "companies.view",
        "notifications.view",
        "analytics.view",
    ]),
    ("support", "Qo'llab-quvvatlash xodimi", False, [
        "users.view", "users.message",
        "tenders.view",
        "companies.view",
        "notifications.view",
        "audit_log.view",
    ]),
    ("analyst", "Tahlilchi", False, [
        "tenders.view",
        "companies.view",
        "financials.view",
        "analytics.view",
        "audit_log.view",
    ]),
]


async def main():
    from sqlalchemy import delete, insert, select, text

    from app.database import async_session
    from app.models.auth.role import Permission, Role, role_permissions

    async with async_session() as session:
        # Seed permissions
        perm_map: dict[str, int] = {}
        for name, resource, action, description in PERMISSIONS:
            result = await session.execute(select(Permission).where(Permission.name == name))
            existing = result.scalar_one_or_none()
            if existing:
                perm_map[name] = existing.id
            else:
                p = Permission(name=name, resource=resource, action=action,
                               description=description, is_system=True)
                session.add(p)
                await session.flush()
                perm_map[name] = p.id

        # Seed roles
        for role_name, role_desc, is_system, perm_names in ROLES:
            result = await session.execute(select(Role).where(Role.name == role_name))
            role = result.scalar_one_or_none()
            if not role:
                role = Role(name=role_name, description=role_desc, is_system=is_system)
                session.add(role)
                await session.flush()

            # Rebuild role-permission links
            await session.execute(
                delete(role_permissions).where(role_permissions.c.role_id == role.id)
            )
            for pname in perm_names:
                pid = perm_map.get(pname)
                if pid:
                    await session.execute(
                        insert(role_permissions).values(role_id=role.id, permission_id=pid)
                    )

        await session.commit()
        print(f"✓ {len(PERMISSIONS)} ta permission va {len(ROLES)} ta rol yaratildi")


if __name__ == "__main__":
    asyncio.run(main())
