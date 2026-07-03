"""Start, help, and inline menu navigation handlers."""

import logging

from aiogram import F, Router
from aiogram.filters import Command, CommandObject
from aiogram.types import CallbackQuery, Message
from sqlalchemy import select

from app.database import async_session
from app.models.auth.user import User
from bot.keyboards.inline import main_inline_kb, link_account_kb
from bot.keyboards.reply import main_menu_kb

router = Router()
logger = logging.getLogger(__name__)


async def _handle_deep_link(message: Message, token: str, telegram_id: str) -> bool:
    """Process a link_TOKEN deep link. Returns True if handled."""
    try:
        import redis.asyncio as aioredis
        from app.config import settings

        r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        redis_key = f"tg_link:{token}"
        user_id = await r.get(redis_key)

        if not user_id:
            await r.close()
            await message.answer(
                "⚠️ Havola muddati tugagan yoki noto'g'ri.\n\n"
                "Web saytda qaytadan urinib ko'ring\n"
                "yoki /link orqali ulang.",
                reply_markup=main_menu_kb(),
            )
            return True

        async with async_session() as db:
            user = (await db.execute(
                select(User).where(User.id == int(user_id), User.is_deleted.is_(False))
            )).scalar_one_or_none()

            if not user:
                await r.delete(redis_key)
                await r.close()
                await message.answer("❌ Foydalanuvchi topilmadi.", reply_markup=main_menu_kb())
                return True

            if user.telegram_id and user.telegram_id != telegram_id:
                await r.delete(redis_key)
                await r.close()
                await message.answer(
                    "⚠️ Bu akkaunt boshqa Telegram\nhisobiga ulangan.",
                    reply_markup=main_menu_kb(),
                )
                return True

            user.telegram_id = telegram_id
            if message.from_user:
                user.telegram_username = message.from_user.username or ""
            await db.commit()

        await r.delete(redis_key)
        await r.close()

        await message.answer(
            "✅ <b>Muvaffaqiyatli ulandi!</b>\n\n"
            f"👤 <b>{user.full_name}</b>\n"
            f"📧 {user.email}\n\n"
            "Endi botdan to'liq\n"
            "foydalanishingiz mumkin! 🎉",
            reply_markup=main_menu_kb(),
        )
        return True

    except Exception:
        logger.exception("Deep link error")
        await message.answer("❌ Xatolik yuz berdi. Qaytadan urinib ko'ring.")
        return True


@router.message(Command("start"))
async def cmd_start(message: Message, command: CommandObject = None, db_user: User | None = None, telegram_id: str = "", **kwargs) -> None:
    if command and command.args and command.args.startswith("link_"):
        token = command.args[5:]
        if await _handle_deep_link(message, token, telegram_id):
            return

    if db_user:
        name = db_user.full_name or "foydalanuvchi"
        plan = kwargs.get("user_plan", "free")
        company = db_user.company.name if db_user.company else "belgilanmagan"
        is_admin = db_user.is_admin or db_user.is_superadmin

        plan_emoji = {"free": "🆓", "pro": "🥈", "business": "🥇"}.get(plan, "📦")

        await message.answer(
            f"Salom, <b>{name}</b>! 👋\n\n"
            f"🏢 <b>{company}</b>\n"
            f"{plan_emoji} Tarif: <b>{plan.upper()}</b>\n"
            f"{'👑 Admin' if db_user.is_superadmin else '🛡 Admin' if db_user.is_admin else '👤 Foydalanuvchi'}\n\n"
            f"Quyidagi menyu orqali tanlang 👇",
            reply_markup=main_menu_kb(),
        )
        await message.answer(
            "<b>📌 Tezkor menyu</b>",
            reply_markup=main_inline_kb(is_admin),
        )
    else:
        await message.answer(
            f"<b>TENDER</b>IQ\n\n"
            f"O'zbekiston davlat tenderlari uchun\n"
            f"yagona intellektual platforma\n\n"
            f"📋 Mos tenderlarni topish\n"
            f"👥 Raqobatchilar tahlili\n"
            f"💰 Narx bashorati\n"
            f"📄 Hujjat tekshiruvi\n"
            f"🗺 Hudud bo'yicha xarita\n"
            f"📊 Win/Loss statistika\n\n"
            f"Boshlash uchun akkauntingizni ulang 👇",
            reply_markup=link_account_kb(),
        )


@router.message(Command("help"))
async def cmd_help(message: Message, db_user: User | None = None, **kwargs) -> None:
    is_admin = db_user and (db_user.is_admin or db_user.is_superadmin)

    text = (
        "📖 <b>Yordam</b>\n\n"
        "<b>▸ Asosiy</b>\n"
        "  /start — Bosh menyu\n"
        "  /link — Akkauntni ulash\n"
        "  /profile — Kompaniya profili\n\n"
        "<b>▸ Tenderlar</b>\n"
        "  /tenders — Faol tenderlar\n"
        "  /search — Qidirish\n"
        "  /saved — Saqlanganlar\n\n"
        "<b>▸ Tahlil</b>\n"
        "  /stats — Statistika\n"
        "  /map — Tender xaritasi\n\n"
        "<b>▸ Boshqa</b>\n"
        "  /plan — Obuna rejasi\n"
        "  /settings — Sozlamalar\n"
    )
    if is_admin:
        text += "\n<b>▸ Admin</b>\n  /admin — Admin panel\n"

    text += "\n💬 Yordam: @tenderiq_support"

    await message.answer(text)


# ─── Inline menu navigation ───

@router.callback_query(F.data == "menu_home")
async def menu_home(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    is_admin = db_user and (db_user.is_admin or db_user.is_superadmin)
    await callback.message.edit_text(
        "<b>📌 Tezkor menyu</b>",
        reply_markup=main_inline_kb(is_admin),
    )
    await callback.answer()


@router.callback_query(F.data == "menu_tenders")
async def menu_tenders(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await callback.answer("Avval /link orqali akkauntni ulang")
        return
    from bot.handlers.tenders import _show_tenders_page
    await _show_tenders_page(callback.message, db_user, 1, edit=True)
    await callback.answer()


@router.callback_query(F.data == "menu_search")
async def menu_search(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await callback.answer("Avval /link orqali akkauntni ulang")
        return
    await callback.message.answer(
        "🔍 <b>Qidiruv</b>\n\n"
        "Kalit so'zni kiriting:\n"
        "<i>masalan: qurilish, IT xizmatlari, tibbiyot</i>"
    )
    await callback.answer()


@router.callback_query(F.data == "menu_profile")
async def menu_profile(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await callback.answer("Avval /link orqali akkauntni ulang")
        return
    from bot.handlers.profile import cmd_profile
    await cmd_profile(callback.message, None, db_user=db_user)
    await callback.answer()


@router.callback_query(F.data == "menu_saved")
async def menu_saved(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await callback.answer("Avval /link orqali akkauntni ulang")
        return
    from bot.handlers.tenders import cmd_saved
    await cmd_saved(callback.message, db_user=db_user)
    await callback.answer()


@router.callback_query(F.data == "menu_stats")
async def menu_stats(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await callback.answer("Avval /link orqali akkauntni ulang")
        return
    from bot.handlers.analytics import cmd_stats
    await cmd_stats(callback.message, db_user=db_user)
    await callback.answer()


@router.callback_query(F.data == "menu_map")
async def menu_map(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await callback.answer("Avval /link orqali akkauntni ulang")
        return
    from bot.handlers.analytics import cmd_map
    await cmd_map(callback.message, db_user=db_user)
    await callback.answer()


@router.callback_query(F.data == "menu_docs")
async def menu_docs(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await callback.answer("Avval /link orqali akkauntni ulang")
        return
    from bot.handlers.documents import cmd_documents
    await cmd_documents(callback.message, db_user=db_user)
    await callback.answer()


@router.callback_query(F.data == "menu_plan")
async def menu_plan(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await callback.answer("Avval /link orqali akkauntni ulang")
        return
    from bot.handlers.subscription import cmd_plan
    await cmd_plan(callback.message, db_user=db_user, user_plan=kwargs.get("user_plan", "free"))
    await callback.answer()


@router.callback_query(F.data == "menu_link")
async def menu_link(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    await callback.message.answer(
        "🔗 <b>Akkaunt ulash</b>\n\n"
        "TenderIQ web saytida ro'yxatdan o'tgan\n"
        "emailingizni kiriting:\n\n"
        "/link — boshlash"
    )
    await callback.answer()


@router.callback_query(F.data == "menu_admin")
async def menu_admin(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user or not (db_user.is_admin or db_user.is_superadmin):
        await callback.answer("Ruxsat yoq")
        return
    from bot.handlers.admin import cmd_admin
    await cmd_admin(callback.message, db_user=db_user)
    await callback.answer()


@router.callback_query(F.data == "noop")
async def noop(callback: CallbackQuery, **kwargs) -> None:
    await callback.answer()
