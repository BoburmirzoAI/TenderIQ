"""PDF document upload and analysis handlers — uses DocumentChecker."""

import os
import tempfile

from aiogram import F, Router
from aiogram.types import InlineKeyboardButton, Message
from aiogram.utils.keyboard import InlineKeyboardBuilder

from app.models.user import User
from app.services.document_checker import DocumentChecker

router = Router()

checker = DocumentChecker()


def _progress_bar(value: int, max_val: int = 100, length: int = 15) -> str:
    filled = round(value / max_val * length) if max_val > 0 else 0
    return "▓" * filled + "░" * (length - filled)


@router.message(F.text == "📄 Hujjatlar")
async def cmd_documents(message: Message, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await message.answer("Avval akkauntingizni ulang: /link")
        return

    kb = InlineKeyboardBuilder()
    kb.row(InlineKeyboardButton(text="🏠 Bosh menyu", callback_data="menu_home"))

    await message.answer(
        "📄 <b>Hujjat tekshiruvi</b>\n\n"
        "Tender hujjatlarini tekshirish uchun\n"
        "PDF faylni yuboring.\n\n"
        "<b>Tekshiriladigan talablar:</b>\n"
        "✅ Litsenziya va sertifikatlar\n"
        "✅ Bank kafolati\n"
        "✅ Soliq ma'lumotnomasi\n"
        "✅ Moliyaviy hisobot\n"
        "✅ Texnik taklif\n"
        "✅ Narx taklifi\n"
        "✅ va boshqa 9 ta talab\n\n"
        "📎 <b>PDF faylni yuboring</b> 👇",
        reply_markup=kb.as_markup(),
    )


@router.message(F.document)
async def handle_document(message: Message, db_user: User | None = None, user_plan: str = "free", **kwargs) -> None:
    if not db_user:
        await message.answer("Avval akkauntingizni ulang: /link")
        return

    doc = message.document
    if not doc or not doc.file_name or not doc.file_name.lower().endswith(".pdf"):
        await message.answer("⚠️ Faqat PDF formatdagi hujjatlar qabul qilinadi.")
        return

    if doc.file_size and doc.file_size > 10 * 1024 * 1024:
        await message.answer("⚠️ Fayl hajmi 10 MB dan oshmasligi kerak.")
        return

    processing = await message.answer(
        "📄 <b>Tahlil jarayoni</b>\n\n"
        "⏳ Hujjat qabul qilindi...\n"
        "Tahlil qilinmoqda..."
    )

    try:
        bot = message.bot
        file = await bot.get_file(doc.file_id)

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            await bot.download_file(file.file_path, destination=tmp)
            tmp_path = tmp.name

        result = checker.analyze(tmp_path)
        os.unlink(tmp_path)

        completeness = result["completeness_pct"]
        risk = result["risk_level"]

        risk_emoji = {"past": "🟢", "o'rta": "🟡", "yuqori": "🔴"}.get(risk, "⚪")
        risk_label = {"past": "Past", "o'rta": "O'rta", "yuqori": "Yuqori"}.get(risk, risk)

        lines = [
            f"📄 <b>Tahlil natijasi</b>\n\n"
            f"📄 Sahifalar: <b>{result['total_pages']}</b> · "
            f"So'zlar: <b>{result['word_count']:,}</b>\n\n"
            f"📊 Tuliqlik: <b>{completeness}%</b>\n"
            f"{_progress_bar(completeness)} {completeness}%\n\n"
            f"{risk_emoji} Risk: <b>{risk_label}</b> "
            f"({result['found_required']}/{result['total_required']} talab)"
        ]

        found_reqs = [r for r in result.get("requirements", []) if r["found"]]
        missing_req = result.get("missing_required", [])
        missing_opt = result.get("missing_optional", [])

        if found_reqs:
            lines.append(f"\n<b>✅ Topilgan ({len(found_reqs)}):</b>")
            for req in found_reqs[:8]:
                lines.append(f"  ✅ {req['name_uz']}")
            if len(found_reqs) > 8:
                lines.append(f"  <i>... va yana {len(found_reqs) - 8} ta</i>")

        if missing_req:
            lines.append(f"\n<b>❌ Topilmagan — majburiy ({len(missing_req)}):</b>")
            for req in missing_req[:6]:
                lines.append(f"  ❌ {req['name_uz']}")

        if missing_opt:
            lines.append(f"\n<b>⚠️ Topilmagan — ixtiyoriy ({len(missing_opt)}):</b>")
            for req in missing_opt[:4]:
                lines.append(f"  ⚠️ {req['name_uz']}")

        dates = result.get("dates_found", [])
        amounts = result.get("amounts_found", [])

        if dates or amounts:
            lines.append("\n<b>📋 Topilgan ma'lumotlar:</b>")
            if dates:
                lines.append(f"  📅 Sanalar: {', '.join(dates[:5])}")
            if amounts:
                lines.append(f"  💰 Summalar: {', '.join(amounts[:5])}")

        tips = result.get("tips", [])
        if tips:
            lines.append("\n<b>💡 Tavsiyalar:</b>")
            for tip in tips[:3]:
                lines.append(f"  • {tip}")

        kb = InlineKeyboardBuilder()
        kb.row(InlineKeyboardButton(text="🏠 Bosh menyu", callback_data="menu_home"))

        await processing.edit_text("\n".join(lines), reply_markup=kb.as_markup())

    except Exception:
        kb = InlineKeyboardBuilder()
        kb.row(InlineKeyboardButton(text="🏠 Bosh menyu", callback_data="menu_home"))
        await processing.edit_text(
            "❌ <b>Xatolik</b>\n\n"
            "Hujjatni tahlil qilishda xatolik.\n"
            "Qaytadan urinib ko'ring yoki\n"
            "boshqa fayl yuboring.",
            reply_markup=kb.as_markup(),
        )
