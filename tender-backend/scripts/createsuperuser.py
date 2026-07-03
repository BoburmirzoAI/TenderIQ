"""Create superuser — Django's createsuperuser equivalent for FastAPI.

Usage:
  Interactive:    python -m scripts.createsuperuser
  Non-interactive: python -m scripts.createsuperuser --email admin@example.com --password secret123
"""

import argparse
import asyncio
import getpass
import sys


def parse_args():
    parser = argparse.ArgumentParser(description="Create a superadmin user")
    parser.add_argument("--email", help="Admin email")
    parser.add_argument("--password", help="Admin password (min 6 chars)")
    parser.add_argument("--name", default="Admin", help="Full name (default: Admin)")
    return parser.parse_args()


async def main():
    from app.database import async_session
    from app.models.auth.user import User
    from app.repositories.auth.user_repo import UserRepository
    from app.utils.security import hash_password

    args = parse_args()

    # --- gather inputs ---
    if args.email:
        email = args.email.strip()
    else:
        email = input("Email: ").strip()

    if not email:
        print("Email kiritilmadi")
        sys.exit(1)

    full_name = args.name.strip() or "Admin"

    if args.password:
        password = args.password
        if len(password) < 6:
            print("Parol kamida 6 ta belgi bo'lishi kerak")
            sys.exit(1)
    else:
        password = getpass.getpass("Parol: ")
        if len(password) < 6:
            print("Parol kamida 6 ta belgi bo'lishi kerak")
            sys.exit(1)
        password2 = getpass.getpass("Parolni tasdiqlang: ")
        if password != password2:
            print("Parollar mos kelmadi")
            sys.exit(1)

    # --- database ---
    async with async_session() as session:
        repo = UserRepository(session)
        existing = await repo.get_by_email(email)

        if existing:
            if not args.email:  # interactive only
                confirm = input(
                    f"'{email}' allaqachon mavjud. Superadmin qilsinmi? (y/n): "
                ).strip().lower()
                if confirm != "y":
                    print("Bekor qilindi")
                    sys.exit(0)

            existing.is_admin = True
            existing.is_superadmin = True
            existing.is_verified = True
            existing.is_active = True
            existing.hashed_password = hash_password(password)
            await session.commit()
            await session.refresh(existing)
            print(f"✓ User #{existing.id} ({email}) superadmin qilindi!")
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
            await session.refresh(user)
            print(f"✓ Superuser yaratildi: #{user.id} — {email}")


if __name__ == "__main__":
    asyncio.run(main())
