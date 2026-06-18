"""Subscription plan and settings handlers."""

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, InlineKeyboardButton, Message
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy import select

from app.constants import PLAN_LIMITS, PLAN_PRICES_UZS, SubscriptionPlan
from app.database import async_session
from app.models.user import User
from bot.keyboards.inline import settings_inline_kb, upgrade_kb
from bot.keyboards.reply import main_menu_kb

router = Router()

PLAN_EMOJI = {"free": "🆓", "pro": "🥈", "business": "🥇"}


@router.message(Command("plan"))
@router.message(F.text == "💳 Obuna")
async def cmd_plan(message: Message, db_user: User | None = None, user_plan: str = "free", **kwargs) -> None:
    if not db_user:
        await message.answer("Avval akkauntingizni ulang: /link")
        return

    plans_text = ""
    for plan in SubscriptionPlan:
        limits = PLAN_LIMITS[plan]
        price = PLAN_PRICES_UZS[plan]
        is_current = plan.value == user_plan
        marker = " ← 📌" if is_current else ""
        emoji = PLAN_EMOJI.get(plan.value, "📦")

        plans_text += (
            f"\n{emoji} <b>{plan.value.upper()}{marker}</b>\n"
            f"💰 {price:,} UZS/oy\n"
            f"📊 Kunlik so'rovlar: <b>{limits['daily_requests']}</b>\n"
            f"🤖 ML bashorat: {'✅' if limits['ml_access'] else '❌'}\n"
            f"📄 Hujjat tahlili: {'✅' if limits['document_analysis'] else '❌'}\n"
            f"🔌 API: {'✅' if limits['api_access'] else '❌'}\n"
            f"💾 Saqlanganlar: {'♾' if limits['max_saved_tenders'] <= 0 else limits['max_saved_tenders']}\n"
            f"👥 Jamoa: {limits['max_team_members']} kishi\n"
        )

    kb = InlineKeyboardBuilder()
    if user_plan != "business":
        kb.button(text="🥈 PRO — 299,000 UZS/oy", callback_data="upgrade_pro")
        kb.button(text="🥇 BUSINESS — 990,000 UZS/oy", callback_data="upgrade_business")
        kb.adjust(1)
    kb.row(InlineKeyboardButton(text="🏠 Bosh menyu", callback_data="menu_home"))

    await message.answer(
        f"💳 <b>Obuna rejalar</b>\n{plans_text}",
        reply_markup=kb.as_markup(),
    )


@router.callback_query(F.data.startswith("upgrade_"))
async def handle_upgrade(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await callback.answer("Akkaunt ulanmagan")
        return

    plan = callback.data.replace("upgrade_", "")
    plan_enum = SubscriptionPlan.PRO if plan == "pro" else SubscriptionPlan.BUSINESS
    price = PLAN_PRICES_UZS[plan_enum]
    emoji = PLAN_EMOJI.get(plan, "📦")

    kb = InlineKeyboardBuilder()
    kb.row(InlineKeyboardButton(text="« Orqaga", callback_data="menu_plan"))
    kb.row(InlineKeyboardButton(text="🏠 Bosh menyu", callback_data="menu_home"))

    await callback.message.answer(
        f"{emoji} <b>{plan.upper()} rejasi</b>\n\n"
        f"💰 Narxi: <b>{price:,} UZS/oy</b>\n\n"
        "<b>To'lov usullari:</b>\n"
        "1️⃣ Click — web saytda\n"
        "2️⃣ Payme — web saytda\n\n"
        "🌐 Web saytga kiring va <b>To'lovlar</b>\n"
        "bo'limidan obunani rasmiylashtiring.",
        reply_markup=kb.as_markup(),
    )
    await callback.answer()


# ─── Settings ───

@router.message(F.text == "⚙️ Sozlamalar")
@router.message(Command("settings"))
async def cmd_settings(message: Message, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await message.answer("Avval akkauntingizni ulang: /link")
        return

    lang_labels = {"uz": "O'zbekcha 🇺🇿", "ru": "Русский 🇷🇺", "en": "English 🇬🇧"}

    await message.answer(
        "⚙️ <b>Sozlamalar</b>\n\n"
        f"🌐 Til: <b>{lang_labels.get(db_user.language, db_user.language)}</b>\n\n"
        "<b>Bildirishnomalar:</b>\n"
        f"📋 Yangi tenderlar: {'✅' if db_user.notify_new_tenders else '❌'}\n"
        f"🎯 Mos tenderlar: {'✅' if db_user.notify_match else '❌'}\n"
        f"⏰ Muddat eslatma: {'✅' if db_user.notify_deadline else '❌'}\n"
        f"📊 Natijalar: {'✅' if db_user.notify_results else '❌'}\n"
        f"📱 Telegram: {'✅' if db_user.notify_telegram else '❌'}",
        reply_markup=settings_inline_kb(db_user),
    )


@router.callback_query(F.data == "set_toggle_tg")
async def toggle_tg_notify(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await callback.answer("Akkaunt ulanmagan")
        return

    async with async_session() as db:
        user = (await db.execute(select(User).where(User.id == db_user.id))).scalar_one()
        user.notify_telegram = not user.notify_telegram
        await db.commit()
        status = "yoqildi ✅" if user.notify_telegram else "o'chirildi ❌"
        await callback.message.edit_reply_markup(reply_markup=settings_inline_kb(user))

    await callback.answer(f"Telegram: {status}")


@router.callback_query(F.data == "set_lang")
async def cycle_language(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await callback.answer("Akkaunt ulanmagan")
        return

    lang_cycle = {"uz": "ru", "ru": "en", "en": "uz"}
    lang_labels = {"uz": "O'zbekcha 🇺🇿", "ru": "Русский 🇷🇺", "en": "English 🇬🇧"}

    async with async_session() as db:
        user = (await db.execute(select(User).where(User.id == db_user.id))).scalar_one()
        user.language = lang_cycle.get(user.language, "uz")
        await db.commit()
        new_lang = user.language
        await callback.message.edit_reply_markup(reply_markup=settings_inline_kb(user))

    await callback.answer(f"Til: {lang_labels.get(new_lang, new_lang)}")


@router.callback_query(F.data.startswith("set_n_"))
async def toggle_notification(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await callback.answer("Akkaunt ulanmagan")
        return

    field_map = {
        "set_n_new": "notify_new_tenders",
        "set_n_match": "notify_match",
        "set_n_deadline": "notify_deadline",
        "set_n_results": "notify_results",
    }
    field = field_map.get(callback.data)
    if not field:
        await callback.answer()
        return

    async with async_session() as db:
        user = (await db.execute(select(User).where(User.id == db_user.id))).scalar_one()
        current = getattr(user, field)
        setattr(user, field, not current)
        await db.commit()
        status = "yoqildi ✅" if not current else "o'chirildi ❌"
        await callback.message.edit_reply_markup(reply_markup=settings_inline_kb(user))

    await callback.answer(status)


@router.message(F.text == "🔙 Orqaga")
async def back_to_menu(message: Message, **kwargs) -> None:
    await message.answer("Asosiy menyu:", reply_markup=main_menu_kb())
