"""Profile and account linking handlers — real DB integration."""

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, InlineKeyboardButton, Message
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy import select

from app.database import async_session
from app.models.company import Company
from app.models.user import User
from bot.keyboards.inline import category_kb, region_kb
from bot.keyboards.reply import cancel_kb, main_menu_kb

router = Router()


class LinkState(StatesGroup):
    waiting_email = State()


class ProfileSetup(StatesGroup):
    waiting_company_name = State()
    waiting_stir = State()
    waiting_categories = State()
    waiting_regions = State()
    waiting_min_amount = State()
    waiting_max_amount = State()
    confirm = State()


def _fmt(amount: float | None) -> str:
    if not amount:
        return "—"
    if amount >= 1e9:
        return f"{amount/1e9:.1f} mlrd"
    if amount >= 1e6:
        return f"{amount/1e6:.1f} mln"
    return f"{amount:,.0f}"


# ─── Account linking ───

@router.message(Command("link"))
async def cmd_link(message: Message, state: FSMContext, db_user: User | None = None, telegram_id: str = "", **kwargs) -> None:
    if db_user:
        kb = InlineKeyboardBuilder()
        kb.row(
            InlineKeyboardButton(text="🔓 Uzish", callback_data="do_unlink"),
            InlineKeyboardButton(text="🏠 Menyu", callback_data="menu_home"),
        )
        await message.answer(
            "🔗 <b>Akkaunt ulangan</b>\n\n"
            f"👤 <b>{db_user.full_name}</b>\n"
            f"📧 {db_user.email}\n\n"
            "Boshqa akkauntga ulash uchun\navval uzishingiz kerak.",
            reply_markup=kb.as_markup(),
        )
        return

    await state.set_state(LinkState.waiting_email)
    await message.answer(
        "🔗 <b>Akkaunt ulash</b>\n\n"
        "TenderIQ web saytida ro'yxatdan\n"
        "o'tgan <b>emailingizni</b> kiriting:",
        reply_markup=cancel_kb(),
    )


@router.message(LinkState.waiting_email)
async def process_link_email(message: Message, state: FSMContext, telegram_id: str = "", **kwargs) -> None:
    if message.text == "❌ Bekor qilish":
        await state.clear()
        await message.answer("Bekor qilindi.", reply_markup=main_menu_kb())
        return

    email = message.text.strip().lower()
    if "@" not in email or "." not in email:
        await message.answer("⚠️ Noto'g'ri email format.\nQaytadan kiriting:")
        return

    async with async_session() as db:
        user = (await db.execute(
            select(User).where(User.email == email, User.is_deleted.is_(False))
        )).scalar_one_or_none()

        if not user:
            await message.answer(
                f"❌ <b>{email}</b> bilan akkaunt topilmadi.\n\n"
                "TenderIQ web saytida avval\n"
                "ro'yxatdan o'ting.\n\n"
                "Qaytadan urinish: /link",
                reply_markup=main_menu_kb(),
            )
            await state.clear()
            return

        if user.telegram_id and user.telegram_id != telegram_id:
            await message.answer(
                "⚠️ Bu akkaunt boshqa Telegram\n"
                "hisobiga ulangan.\n\n"
                "Avval web saytda Telegram\n"
                "ulanishini olib tashlang.",
                reply_markup=main_menu_kb(),
            )
            await state.clear()
            return

        user.telegram_id = telegram_id
        if message.from_user:
            user.telegram_username = message.from_user.username or ""
        await db.commit()

    await state.clear()
    await message.answer(
        "✅ <b>Muvaffaqiyatli!</b>\n\n"
        f"👤 <b>{user.full_name}</b>\n"
        f"📧 {email}\n\n"
        "Endi botdan to'liq\n"
        "foydalanishingiz mumkin! 🎉",
        reply_markup=main_menu_kb(),
    )


@router.message(Command("unlink"))
@router.callback_query(F.data == "do_unlink")
async def cmd_unlink(message_or_callback, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        if isinstance(message_or_callback, CallbackQuery):
            await message_or_callback.answer("Akkaunt ulanmagan")
        else:
            await message_or_callback.answer("Akkaunt ulanmagan. /link orqali ulang.")
        return

    async with async_session() as db:
        user = (await db.execute(select(User).where(User.id == db_user.id))).scalar_one()
        user.telegram_id = None
        user.telegram_username = None
        await db.commit()

    text = (
        "🔓 <b>Uzildi</b>\n\n"
        "Akkaunt ulanishi olib tashlandi.\n"
        "Qayta ulash: /link"
    )

    if isinstance(message_or_callback, CallbackQuery):
        await message_or_callback.message.edit_text(text)
        await message_or_callback.answer()
    else:
        await message_or_callback.answer(text, reply_markup=main_menu_kb())


# ─── Company profile ───

@router.message(Command("profile"))
@router.message(F.text == "🏢 Kompaniya")
async def cmd_profile(message: Message, state: FSMContext = None, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await message.answer("Avval akkauntingizni ulang: /link")
        return

    if db_user.company:
        c = db_user.company
        cats = ", ".join(c.categories) if isinstance(c.categories, list) else (c.categories or "—")
        regs = ", ".join(c.regions) if isinstance(c.regions, list) else (c.regions or "—")

        kb = InlineKeyboardBuilder()
        kb.row(
            InlineKeyboardButton(text="✏️ O'zgartirish", callback_data="edit_profile"),
            InlineKeyboardButton(text="🏠 Menyu", callback_data="menu_home"),
        )

        await message.answer(
            "🏢 <b>Kompaniya profili</b>\n\n"
            f"🏢 <b>{c.name}</b>\n"
            f"🔢 STIR: {c.stir or '—'}\n"
            f"📂 Sohalar: {cats}\n"
            f"📍 Hududlar: {regs}\n"
            f"💰 Summa: {_fmt(c.min_amount)} — {_fmt(c.max_amount)} UZS",
            reply_markup=kb.as_markup(),
        )
        return

    if state:
        await state.set_state(ProfileSetup.waiting_company_name)
    await message.answer(
        "🏢 <b>Yangi profil</b>\n\n"
        "Kompaniya hali yo'q. Yaratamiz!\n\n"
        "📝 Kompaniya nomini kiriting:",
        reply_markup=cancel_kb(),
    )


@router.callback_query(F.data == "edit_profile")
async def edit_profile_btn(callback: CallbackQuery, **kwargs) -> None:
    await callback.message.answer("Profilni o'zgartirish: /editprofile")
    await callback.answer()


@router.message(ProfileSetup.waiting_company_name)
async def process_company_name(message: Message, state: FSMContext, **kwargs) -> None:
    if message.text == "❌ Bekor qilish":
        await state.clear()
        await message.answer("Bekor qilindi.", reply_markup=main_menu_kb())
        return
    await state.update_data(company_name=message.text.strip())
    await state.set_state(ProfileSetup.waiting_stir)
    await message.answer(
        "🔢 <b>STIR raqami</b>\n\n"
        "9 ta raqamli STIR ni kiriting\n"
        "yoki /skip bosing:"
    )


@router.message(ProfileSetup.waiting_stir)
async def process_stir(message: Message, state: FSMContext, **kwargs) -> None:
    if message.text == "❌ Bekor qilish":
        await state.clear()
        await message.answer("Bekor qilindi.", reply_markup=main_menu_kb())
        return

    if message.text == "/skip":
        await state.update_data(stir=None)
    else:
        stir = message.text.strip()
        if not stir.isdigit() or len(stir) != 9:
            await message.answer("⚠️ STIR 9 ta raqamdan iborat.\nQaytadan kiriting yoki /skip:")
            return
        await state.update_data(stir=stir)

    await state.set_state(ProfileSetup.waiting_categories)
    await message.answer(
        "📂 <b>Faoliyat sohalari</b>\n\n"
        "Quyidagilardan tanlang:",
        reply_markup=category_kb(),
    )


@router.callback_query(ProfileSetup.waiting_categories, F.data.startswith("cat_"))
async def process_category(callback: CallbackQuery, state: FSMContext, **kwargs) -> None:
    data = await state.get_data()
    selected = data.get("categories", [])
    value = callback.data.replace("cat_", "")

    if value == "done":
        if not selected:
            await callback.answer("Kamida 1 ta soha tanlang!")
            return
        await state.set_state(ProfileSetup.waiting_regions)
        await callback.message.edit_text(
            "📍 <b>Hududlar</b>\n\n"
            "Quyidagilardan tanlang:",
            reply_markup=region_kb(),
        )
        return

    if value in selected:
        selected.remove(value)
    else:
        selected.append(value)

    await state.update_data(categories=selected)
    await callback.message.edit_reply_markup(reply_markup=category_kb(selected))
    await callback.answer()


@router.callback_query(ProfileSetup.waiting_regions, F.data.startswith("reg_"))
async def process_region(callback: CallbackQuery, state: FSMContext, **kwargs) -> None:
    data = await state.get_data()
    selected = data.get("regions", [])
    value = callback.data.replace("reg_", "")

    if value == "done":
        await state.set_state(ProfileSetup.waiting_min_amount)
        await callback.message.answer(
            "💰 <b>Minimal summa</b>\n\n"
            "Minimal tender summasini\n"
            "mln UZS da kiriting:\n"
            "<i>Masalan: 50</i>"
        )
        return

    if value in selected:
        selected.remove(value)
    else:
        selected.append(value)

    await state.update_data(regions=selected)
    await callback.message.edit_reply_markup(reply_markup=region_kb(selected))
    await callback.answer()


@router.message(ProfileSetup.waiting_min_amount)
async def process_min_amount(message: Message, state: FSMContext, **kwargs) -> None:
    try:
        amount = float(message.text.replace(",", ".")) * 1_000_000
        await state.update_data(min_amount=amount)
        await state.set_state(ProfileSetup.waiting_max_amount)
        await message.answer(
            "💰 <b>Maksimal summa</b>\n\n"
            "Maksimal tender summasini\n"
            "mln UZS da kiriting:"
        )
    except ValueError:
        await message.answer("⚠️ Raqam kiriting (masalan: 50)")


@router.message(ProfileSetup.waiting_max_amount)
async def process_max_amount(message: Message, state: FSMContext, **kwargs) -> None:
    try:
        amount = float(message.text.replace(",", ".")) * 1_000_000
        await state.update_data(max_amount=amount)
        await state.set_state(ProfileSetup.confirm)

        data = await state.get_data()
        cats = ", ".join(data.get("categories", []))
        regs = ", ".join(data.get("regions", []))

        await message.answer(
            "📋 <b>Tasdiqlash</b>\n\n"
            f"🏢 <b>{data.get('company_name')}</b>\n"
            f"🔢 STIR: {data.get('stir') or '—'}\n"
            f"📂 Sohalar: {cats}\n"
            f"📍 Hududlar: {regs}\n"
            f"💰 {data.get('min_amount', 0)/1e6:.0f} — {amount/1e6:.0f} mln\n\n"
            "Tasdiqlaysizmi? (<b>ha</b> / <b>yoq</b>)"
        )
    except ValueError:
        await message.answer("⚠️ Raqam kiriting (masalan: 500)")


@router.message(ProfileSetup.confirm)
async def process_confirm(message: Message, state: FSMContext, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await state.clear()
        await message.answer("Akkaunt ulanmagan. /link", reply_markup=main_menu_kb())
        return

    if message.text and message.text.lower() in ("ha", "yes", "tasdiqlash"):
        data = await state.get_data()

        async with async_session() as db:
            company = Company(
                user_id=db_user.id,
                name=data["company_name"],
                stir=data.get("stir"),
                categories=data.get("categories", []),
                regions=data.get("regions", []),
                min_amount=data.get("min_amount", 0),
                max_amount=data.get("max_amount", 0),
            )
            db.add(company)
            await db.commit()

        await message.answer(
            "✅ <b>Saqlandi!</b>\n\n"
            "Kompaniya profili yaratildi.\n"
            "Mos tenderlar avtomatik yuboriladi.\n\n"
            "📋 Tenderlarni ko'rish: /tenders",
            reply_markup=main_menu_kb(),
        )
        await state.clear()

    elif message.text and message.text.lower() in ("yoq", "yo'q", "no", "bekor"):
        await state.clear()
        await message.answer("Bekor qilindi.", reply_markup=main_menu_kb())
    else:
        await message.answer("'<b>ha</b>' yoki '<b>yoq</b>' deb javob bering.")
