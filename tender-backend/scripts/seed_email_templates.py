"""Seed default email templates into the database."""

import asyncio
import json

TEMPLATES = [
    {
        "slug": "welcome",
        "name": "Xush kelibsiz",
        "category": "auth",
        "subject": "TenderIQ ga xush kelibsiz, {{full_name}}!",
        "description": "Ro'yxatdan o'tgandan so'ng yuboriladi",
        "variables": ["full_name", "email", "login_url"],
        "body": """Assalomu alaykum, {{full_name}}!

TenderIQ platformasiga xush kelibsiz. Siz muvaffaqiyatli ro'yxatdan o'tdingiz.

Platformaga kirish uchun: {{login_url}}

Hisob ma'lumotlaringiz:
  Email: {{email}}

Savollar bo'lsa, biz bilan bog'laning: support@tenderiq.uz

Hurmat bilan,
TenderIQ jamoasi""",
    },
    {
        "slug": "email_verify",
        "name": "Email tasdiqlash",
        "category": "auth",
        "subject": "Email manzilingizni tasdiqlang",
        "description": "Email manzilini tasdiqlash uchun yuboriladi",
        "variables": ["full_name", "verify_url", "expires_in"],
        "body": """Assalomu alaykum, {{full_name}}!

Email manzilingizni tasdiqlash uchun quyidagi havolani bosing:

{{verify_url}}

Havola {{expires_in}} davomida amal qiladi.

Agar siz bu so'rovni yubormagan bo'lsangiz, xabarni e'tiborsiz qoldiring.

Hurmat bilan,
TenderIQ jamoasi""",
    },
    {
        "slug": "password_reset",
        "name": "Parol tiklash",
        "category": "auth",
        "subject": "Parolingizni tiklash",
        "description": "Parol tiklash so'rovida yuboriladi",
        "variables": ["full_name", "reset_url", "expires_in"],
        "body": """Assalomu alaykum, {{full_name}}!

Parolni tiklash uchun quyidagi havolani bosing:

{{reset_url}}

Havola {{expires_in}} davomida amal qiladi.

Agar siz bu so'rovni yubormagan bo'lsangiz, darhol support@tenderiq.uz ga xabar bering.

Hurmat bilan,
TenderIQ jamoasi""",
    },
    {
        "slug": "new_tender_match",
        "name": "Yangi tender mos keldi",
        "category": "tender",
        "subject": "Sizga mos {{match_count}} ta yangi tender topildi",
        "description": "Foydalanuvchi profiliga mos tender chiqqanda yuboriladi",
        "variables": ["full_name", "match_count", "tender_title", "tender_amount", "tender_deadline", "tender_url", "dashboard_url"],
        "body": """Assalomu alaykum, {{full_name}}!

Sizning mezonlaringizga mos {{match_count}} ta yangi tender topildi.

Eng yaxshi moslik:
  Nomi: {{tender_title}}
  Summa: {{tender_amount}}
  Muddat: {{tender_deadline}}

Batafsil ko'rish: {{tender_url}}

Barcha mosliklarni ko'rish: {{dashboard_url}}

Hurmat bilan,
TenderIQ jamoasi""",
    },
    {
        "slug": "tender_deadline",
        "name": "Tender muddati yaqinlashmoqda",
        "category": "tender",
        "subject": "Tender muddati {{days_left}} kun qoldi",
        "description": "Tender deadline dan 3 kun oldin yuboriladi",
        "variables": ["full_name", "tender_title", "tender_deadline", "days_left", "tender_url"],
        "body": """Assalomu alaykum, {{full_name}}!

Diqqat! Kuzatayotgan tenderingizning muddati yaqinlashmoqda.

  Tender: {{tender_title}}
  Muddat: {{tender_deadline}}
  Qolgan vaqt: {{days_left}} kun

Tender sahifasiga o'tish: {{tender_url}}

Hurmat bilan,
TenderIQ jamoasi""",
    },
    {
        "slug": "subscription_activated",
        "name": "Obuna faollashtirildi",
        "category": "subscription",
        "subject": "{{plan}} obunangiz faollashtirildi!",
        "description": "To'lov muvaffaqiyatli bo'lganda yuboriladi",
        "variables": ["full_name", "plan", "expires_at", "daily_limit", "dashboard_url"],
        "body": """Assalomu alaykum, {{full_name}}!

{{plan}} obunangiz muvaffaqiyatli faollashtirildi.

Obuna ma'lumotlari:
  Plan: {{plan}}
  Amal qilish muddati: {{expires_at}}
  Kunlik so'rovlar: {{daily_limit}}

Platformaga kirish: {{dashboard_url}}

To'lovingiz uchun rahmat!

Hurmat bilan,
TenderIQ jamoasi""",
    },
    {
        "slug": "subscription_expiring",
        "name": "Obuna muddati tugayapti",
        "category": "subscription",
        "subject": "Obunangiz {{days_left}} kun ichida tugaydi",
        "description": "Obuna tugashidan 7 kun oldin yuboriladi",
        "variables": ["full_name", "plan", "expires_at", "days_left", "renew_url"],
        "body": """Assalomu alaykum, {{full_name}}!

{{plan}} obunangizning muddati {{days_left}} kun ichida tugaydi.

  Tugash sanasi: {{expires_at}}

Obunani yangilash uchun: {{renew_url}}

Hurmat bilan,
TenderIQ jamoasi""",
    },
    {
        "slug": "maintenance",
        "name": "Texnik xizmat",
        "category": "system",
        "subject": "TenderIQ texnik xizmat rejalashtirilgan",
        "description": "Texnik ishlar oldidan barcha foydalanuvchilarga yuboriladi",
        "variables": ["full_name", "start_time", "duration", "reason"],
        "body": """Assalomu alaykum, {{full_name}}!

TenderIQ platformasida texnik xizmat ishlari rejalashtirilgan.

  Boshlanish vaqti: {{start_time}}
  Davomiyligi: {{duration}}
  Sabab: {{reason}}

Ushbu vaqt oralig'ida platform vaqtincha ishlamaydi.

Noqulaylik uchun uzr so'raymiz.

Hurmat bilan,
TenderIQ jamoasi""",
    },
]


async def main():
    from sqlalchemy import select
    from app.database import async_session
    from app.models.communication.email_template import EmailTemplate

    async with async_session() as session:
        created = 0
        updated = 0
        for tpl in TEMPLATES:
            result = await session.execute(
                select(EmailTemplate).where(EmailTemplate.slug == tpl["slug"])
            )
            existing = result.scalar_one_or_none()
            if existing:
                existing.name = tpl["name"]
                existing.subject = tpl["subject"]
                existing.body = tpl["body"]
                existing.description = tpl["description"]
                existing.category = tpl["category"]
                existing.variables = json.dumps(tpl["variables"])
                updated += 1
            else:
                session.add(EmailTemplate(
                    slug=tpl["slug"],
                    name=tpl["name"],
                    subject=tpl["subject"],
                    body=tpl["body"],
                    description=tpl["description"],
                    category=tpl["category"],
                    variables=json.dumps(tpl["variables"]),
                    is_active=True,
                ))
                created += 1

        await session.commit()
        print(f"✓ {created} ta yangi, {updated} ta yangilandi — jami {len(TEMPLATES)} ta shablon")


if __name__ == "__main__":
    asyncio.run(main())
