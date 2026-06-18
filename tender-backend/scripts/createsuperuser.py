"""Create superuser — Django's createsuperuser equivalent for FastAPI."""

import asyncio
import getpass
import sys


async def main():
    from app.database import async_session
    from app.models.user import User
    from app.repositories.user_repo import UserRepository
    from app.utils.security import hash_password

    email = input("Email: ").strip()
    if not email:
        print("Email kiritilmadi")
        sys.exit(1)

    full_name = input("To'liq ism: ").strip() or "Admin"

    password = getpass.getpass("Parol: ")
    if len(password) < 6:
        print("Parol kamida 6 ta belgi bo'lishi kerak")
        sys.exit(1)

    password2 = getpass.getpass("Parolni tasdiqlang: ")
    if password != password2:
        print("Parollar mos kelmadi")
        sys.exit(1)

    async with async_session() as session:
        repo = UserRepository(session)
        existing = await repo.get_by_email(email)

        if existing:
            confirm = input(f"'{email}' allaqachon mavjud. Admin qilsinmi? (y/n): ").strip().lower()
            if confirm != "y":
                print("Bekor qilindi")
                sys.exit(0)
            existing.is_admin = True
            existing.is_superadmin = True
            existing.is_verified = True
            existing.hashed_password = hash_password(password)
            await session.commit()
            print(f"User #{existing.id} superadmin qilindi!")
        else:
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=hash_password(password),
                is_active=True,
                is_admin=True,
                is_superadmin=True,
                is_verified=True,
            )
            session.add(user)
            await session.commit()
            print(f"Superuser yaratildi: #{user.id} — {email}")


if __name__ == "__main__":
    asyncio.run(main())
