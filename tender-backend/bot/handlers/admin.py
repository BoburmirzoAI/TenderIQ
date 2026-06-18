"""Bot admin panel — manage users, groups, broadcasts, ads. Superadmin/admin only."""

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, InlineKeyboardButton, Message
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy import func, select

from app.database import async_session
from app.models.bot_group import BotGroup
from app.models.tender import Tender
from app.models.user import User
from bot.keyboards.reply import main_menu_kb

router = Router()


class BroadcastState(StatesGroup):
    waiting_message = State()
    waiting_target = State()
    confirm = State()


class AdState(StatesGroup):
    waiting_ad_text = State()
    waiting_ad_target = State()
    confirm_ad = State()


class UserManageState(StatesGroup):
    waiting_user_search = State()


class DmState(StatesGroup):
    waiting_dm = State()


def _is_admin(db_user: User | None) -> bool:
    return db_user is not None and (db_user.is_admin or db_user.is_superadmin)


def _admin_kb() -> InlineKeyboardBuilder:
    kb = InlineKeyboardBuilder()
    kb.row(
        InlineKeyboardButton(text="📊 Statistika", callback_data="adm_stats"),
        InlineKeyboardButton(text="👥 Foydalanuvchilar", callback_data="adm_users"),
    )
    kb.row(
        InlineKeyboardButton(text="💬 Guruhlar", callback_data="adm_groups"),
        InlineKeyboardButton(text="📢 Broadcast", callback_data="adm_broadcast"),
    )
    kb.row(
        InlineKeyboardButton(text="📣 Reklama", callback_data="adm_ad"),
        InlineKeyboardButton(text="🔍 User qidirish", callback_data="adm_search_user"),
    )
    kb.row(InlineKeyboardButton(text="🏠 Bosh menyu", callback_data="menu_home"))
    return kb


# ─── /admin — Main panel ───

@router.message(Command("admin"))
async def cmd_admin(message: Message, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await message.answer("⛔ Bu buyruq faqat adminlar uchun.")
        return

    role = "👑 Superadmin" if db_user.is_superadmin else "🛡 Admin"

    await message.answer(
        f"🛡 <b>Admin panel</b>\n\n"
        f"{role} · <b>{db_user.full_name}</b>\n\n"
        "Quyidagi amallarni tanlang:",
        reply_markup=_admin_kb().as_markup(),
    )


# ─── Stats ───

@router.callback_query(F.data == "adm_stats")
async def admin_stats(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await callback.answer("⛔ Ruxsat yo'q")
        return

    async with async_session() as db:
        total_users = (await db.execute(select(func.count(User.id)).where(User.is_deleted.is_(False)))).scalar() or 0
        active_users = (await db.execute(
            select(func.count(User.id)).where(User.is_active.is_(True), User.is_deleted.is_(False))
        )).scalar() or 0
        tg_linked = (await db.execute(
            select(func.count(User.id)).where(User.telegram_id.isnot(None), User.is_deleted.is_(False))
        )).scalar() or 0
        total_tenders = (await db.execute(
            select(func.count(Tender.id)).where(Tender.is_deleted.is_(False))
        )).scalar() or 0
        active_tenders = (await db.execute(
            select(func.count(Tender.id)).where(Tender.is_deleted.is_(False), Tender.status == "active")
        )).scalar() or 0
        total_groups = (await db.execute(
            select(func.count(BotGroup.id)).where(BotGroup.is_active.is_(True))
        )).scalar() or 0

    kb = InlineKeyboardBuilder()
    kb.row(InlineKeyboardButton(text="« Admin panel", callback_data="adm_back"))

    await callback.message.edit_text(
        "📊 <b>Statistika</b>\n\n"
        "<b>Foydalanuvchilar</b>\n"
        f"👥 Jami: <b>{total_users}</b>\n"
        f"✅ Faol: <b>{active_users}</b>\n"
        f"📱 Telegram: <b>{tg_linked}</b>\n\n"
        "<b>Tenderlar</b>\n"
        f"📋 Jami: <b>{total_tenders:,}</b>\n"
        f"🟢 Faol: <b>{active_tenders:,}</b>\n\n"
        "<b>Guruhlar</b>\n"
        f"💬 Faol: <b>{total_groups}</b>",
        reply_markup=kb.as_markup(),
    )
    await callback.answer()


# ─── Users list ───

@router.callback_query(F.data == "adm_users")
async def admin_users(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await callback.answer("⛔")
        return

    async with async_session() as db:
        stmt = (
            select(User)
            .where(User.is_deleted.is_(False))
            .order_by(User.created_at.desc())
            .limit(15)
        )
        users = (await db.execute(stmt)).scalars().all()

    lines = [f"👥 <b>Foydalanuvchilar</b> ({len(users)})\n"]
    for u in users:
        tg = "📱" if u.telegram_id else "—"
        admin_flag = " 🛡" if u.is_admin else ""
        super_flag = " 👑" if u.is_superadmin else ""
        active = "✅" if u.is_active else "🚫"
        lines.append(
            f"\n{active} <b>{u.full_name}</b>{admin_flag}{super_flag}\n"
            f"📧 {u.email} {tg}"
        )

    kb = InlineKeyboardBuilder()
    for u in users[:10]:
        kb.button(
            text=f"{'✅' if u.is_active else '🚫'} {u.full_name[:30]}",
            callback_data=f"adm_user_{u.id}",
        )
    kb.adjust(1)
    kb.row(
        InlineKeyboardButton(text="🔍 Qidirish", callback_data="adm_search_user"),
        InlineKeyboardButton(text="« Admin panel", callback_data="adm_back"),
    )

    await callback.message.edit_text("\n".join(lines), reply_markup=kb.as_markup())
    await callback.answer()


# ─── User search ───

@router.callback_query(F.data == "adm_search_user")
async def admin_search_user_start(callback: CallbackQuery, state: FSMContext, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await callback.answer("⛔")
        return
    await state.set_state(UserManageState.waiting_user_search)
    await callback.message.answer(
        "🔍 <b>User qidirish</b>\n\n"
        "Email yoki ismni kiriting:"
    )
    await callback.answer()


@router.message(UserManageState.waiting_user_search)
async def admin_search_user_process(message: Message, state: FSMContext, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await state.clear()
        return

    await state.clear()
    query = message.text.strip()

    async with async_session() as db:
        stmt = (
            select(User)
            .where(
                User.is_deleted.is_(False),
                (User.email.ilike(f"%{query}%") | User.full_name.ilike(f"%{query}%")),
            )
            .limit(10)
        )
        users = (await db.execute(stmt)).scalars().all()

    if not users:
        await message.answer(
            f"🔍 <b>«{query}»</b> — topilmadi\n\n/admin"
        )
        return

    kb = InlineKeyboardBuilder()
    for u in users:
        label = f"{'✅' if u.is_active else '🚫'} {u.full_name} · {u.email}"
        kb.button(text=label[:55], callback_data=f"adm_user_{u.id}")
    kb.adjust(1)
    kb.row(InlineKeyboardButton(text="« Admin panel", callback_data="adm_back"))

    await message.answer(
        f"🔍 <b>«{query}»</b> — {len(users)} natija",
        reply_markup=kb.as_markup(),
    )


@router.callback_query(F.data.startswith("adm_user_"))
async def admin_user_detail(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await callback.answer("⛔")
        return

    user_id = int(callback.data.replace("adm_user_", ""))

    async with async_session() as db:
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()

    if not user:
        await callback.answer("Topilmadi")
        return

    tg_info = f"@{user.telegram_username}" if user.telegram_username else (user.telegram_id or "ulanmagan")
    role = "👑 Superadmin" if user.is_superadmin else ("🛡 Admin" if user.is_admin else "👤 User")

    text = (
        f"👤 <b>{user.full_name}</b>\n\n"
        f"📧 {user.email}\n"
        f"📱 {tg_info}\n"
        f"📞 {user.phone or '—'}\n"
        f"{role}\n"
        f"{'✅ Faol' if user.is_active else '🚫 Bloklangan'}\n"
        f"🌐 {user.language.upper()}"
    )

    kb = InlineKeyboardBuilder()
    if user.is_active:
        kb.button(text="🚫 Ban", callback_data=f"adm_ban_{user.id}")
    else:
        kb.button(text="✅ Faollashtirish", callback_data=f"adm_unban_{user.id}")

    if db_user.is_superadmin and not user.is_superadmin:
        if user.is_admin:
            kb.button(text="⬇️ Admin olib tashlash", callback_data=f"adm_rmadmin_{user.id}")
        else:
            kb.button(text="⬆️ Admin qilish", callback_data=f"adm_mkadmin_{user.id}")

    kb.button(text="💬 DM yuborish", callback_data=f"adm_msg_{user.id}")
    kb.adjust(2)
    kb.row(InlineKeyboardButton(text="« Admin panel", callback_data="adm_back"))

    await callback.message.edit_text(text, reply_markup=kb.as_markup())
    await callback.answer()


@router.callback_query(F.data.startswith("adm_ban_"))
async def admin_ban_user(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await callback.answer("⛔")
        return

    user_id = int(callback.data.replace("adm_ban_", ""))
    if user_id == db_user.id:
        await callback.answer("O'zingizni ban qila olmaysiz!")
        return

    async with async_session() as db:
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if not user:
            await callback.answer("Topilmadi")
            return
        if user.is_superadmin:
            await callback.answer("Superadminni ban qilib bo'lmaydi!")
            return
        if user.is_admin and not db_user.is_superadmin:
            await callback.answer("Adminni faqat superadmin ban qila oladi!")
            return

        user.is_active = False
        await db.commit()

    await callback.answer(f"🚫 {user.full_name} ban qilindi")
    await admin_user_detail(callback, db_user)


@router.callback_query(F.data.startswith("adm_unban_"))
async def admin_unban_user(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await callback.answer("⛔")
        return

    user_id = int(callback.data.replace("adm_unban_", ""))

    async with async_session() as db:
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if user:
            user.is_active = True
            await db.commit()

    await callback.answer("✅ Faollashtirildi")
    await admin_user_detail(callback, db_user)


@router.callback_query(F.data.startswith("adm_mkadmin_"))
async def admin_make_admin(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user or not db_user.is_superadmin:
        await callback.answer("⛔ Faqat superadmin!")
        return

    user_id = int(callback.data.replace("adm_mkadmin_", ""))

    async with async_session() as db:
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if user:
            user.is_admin = True
            await db.commit()

    await callback.answer("✅ Admin qilindi")
    await admin_user_detail(callback, db_user)


@router.callback_query(F.data.startswith("adm_rmadmin_"))
async def admin_remove_admin(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user or not db_user.is_superadmin:
        await callback.answer("⛔ Faqat superadmin!")
        return

    user_id = int(callback.data.replace("adm_rmadmin_", ""))

    async with async_session() as db:
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
        if user:
            user.is_admin = False
            await db.commit()

    await callback.answer("⬇️ Admin olib tashlandi")
    await admin_user_detail(callback, db_user)


# ─── Groups ───

@router.callback_query(F.data == "adm_groups")
async def admin_groups(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await callback.answer("⛔")
        return

    async with async_session() as db:
        stmt = (
            select(BotGroup)
            .where(BotGroup.is_active.is_(True))
            .order_by(BotGroup.created_at.desc())
            .limit(20)
        )
        groups = (await db.execute(stmt)).scalars().all()

    if not groups:
        kb = InlineKeyboardBuilder()
        kb.row(InlineKeyboardButton(text="« Admin panel", callback_data="adm_back"))
        await callback.message.edit_text(
            "💬 <b>Guruhlar</b>\n\n"
            "Bot hali hech qanday guruhga\n"
            "qo'shilmagan.",
            reply_markup=kb.as_markup(),
        )
        await callback.answer()
        return

    lines = [f"💬 <b>Guruhlar</b> ({len(groups)})\n"]
    for g in groups:
        members = f" · {g.member_count} a'zo" if g.member_count else ""
        username = f"\n@{g.username}" if g.username else ""
        lines.append(
            f"\n{'✅' if g.is_active else '🚫'} <b>{g.title}</b>{members}{username}"
        )

    kb = InlineKeyboardBuilder()
    kb.row(InlineKeyboardButton(text="📢 Guruhlarga broadcast", callback_data="adm_broadcast_groups"))
    kb.row(InlineKeyboardButton(text="« Admin panel", callback_data="adm_back"))

    await callback.message.edit_text("\n".join(lines), reply_markup=kb.as_markup())
    await callback.answer()


# ─── Broadcast ───

@router.callback_query(F.data == "adm_broadcast")
async def admin_broadcast_start(callback: CallbackQuery, state: FSMContext, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await callback.answer("⛔")
        return

    await state.set_state(BroadcastState.waiting_message)
    await state.update_data(target="users")
    await callback.message.answer(
        "📢 <b>Broadcast</b>\n\n"
        "Barcha foydalanuvchilarga\n"
        "yuboriladigan xabarni yozing.\n\n"
        "<i>HTML format qo'llab-quvvatlanadi</i>\n\n"
        "Bekor qilish: /cancel"
    )
    await callback.answer()


@router.callback_query(F.data == "adm_broadcast_groups")
async def admin_broadcast_groups_start(callback: CallbackQuery, state: FSMContext, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await callback.answer("⛔")
        return

    await state.set_state(BroadcastState.waiting_message)
    await state.update_data(target="groups")
    await callback.message.answer(
        "📢 <b>Guruh broadcast</b>\n\n"
        "Barcha guruhlarga yuboriladigan\n"
        "xabarni yozing.\n\n"
        "<i>HTML format qo'llab-quvvatlanadi</i>\n\n"
        "Bekor qilish: /cancel"
    )
    await callback.answer()


@router.message(BroadcastState.waiting_message)
async def admin_broadcast_message(message: Message, state: FSMContext, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await state.clear()
        return

    if message.text == "/cancel":
        await state.clear()
        await message.answer("Bekor qilindi.", reply_markup=main_menu_kb())
        return

    await state.update_data(broadcast_text=message.text)
    data = await state.get_data()
    target = data.get("target", "users")
    target_label = "barcha foydalanuvchilarga" if target == "users" else "barcha guruhlarga"

    await state.set_state(BroadcastState.confirm)

    kb = InlineKeyboardBuilder()
    kb.row(
        InlineKeyboardButton(text="✅ Yuborish", callback_data="adm_broadcast_confirm"),
        InlineKeyboardButton(text="❌ Bekor", callback_data="adm_broadcast_cancel"),
    )

    await message.answer(
        f"📋 <b>Tasdiqlash</b>\n\n"
        f"📨 Kimga: <b>{target_label}</b>\n\n"
        f"<b>Xabar:</b>\n{message.text}\n\n"
        "Yuborilsinmi?",
        reply_markup=kb.as_markup(),
    )


@router.callback_query(F.data == "adm_broadcast_confirm")
async def admin_broadcast_confirm(callback: CallbackQuery, state: FSMContext, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await callback.answer("⛔")
        await state.clear()
        return

    data = await state.get_data()
    await state.clear()

    text = data.get("broadcast_text", "")
    target = data.get("target", "users")

    if not text:
        await callback.answer("Xabar bo'sh")
        return

    bot = callback.bot
    sent = 0
    failed = 0

    progress = await callback.message.answer("📤 Yuborilmoqda...")

    if target == "users":
        async with async_session() as db:
            result = await db.execute(
                select(User.telegram_id).where(
                    User.telegram_id.isnot(None),
                    User.is_active.is_(True),
                    User.is_deleted.is_(False),
                    User.notify_telegram.is_(True),
                )
            )
            chat_ids = [row[0] for row in result.all()]

        for chat_id in chat_ids:
            try:
                await bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML")
                sent += 1
            except Exception:
                failed += 1

    else:
        async with async_session() as db:
            result = await db.execute(
                select(BotGroup.chat_id).where(BotGroup.is_active.is_(True))
            )
            chat_ids = [row[0] for row in result.all()]

        for chat_id in chat_ids:
            try:
                await bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML")
                sent += 1
            except Exception:
                failed += 1

    await progress.edit_text(
        "✅ <b>Broadcast yakunlandi</b>\n\n"
        f"✅ Yuborildi: <b>{sent}</b>\n"
        f"❌ Xatolik: <b>{failed}</b>\n"
        f"📊 Jami: <b>{sent + failed}</b>"
    )
    await callback.answer()


@router.callback_query(F.data == "adm_broadcast_cancel")
async def admin_broadcast_cancel(callback: CallbackQuery, state: FSMContext, **kwargs) -> None:
    await state.clear()
    await callback.message.edit_text("Bekor qilindi.")
    await callback.answer()


# ─── Ads ───

@router.callback_query(F.data == "adm_ad")
async def admin_ad_start(callback: CallbackQuery, state: FSMContext, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await callback.answer("⛔")
        return

    kb = InlineKeyboardBuilder()
    kb.row(
        InlineKeyboardButton(text="👥 Userlarga", callback_data="adm_ad_users"),
        InlineKeyboardButton(text="💬 Guruhlarga", callback_data="adm_ad_groups"),
    )
    kb.row(InlineKeyboardButton(text="🌐 Hammaga", callback_data="adm_ad_all"))
    kb.row(InlineKeyboardButton(text="« Admin panel", callback_data="adm_back"))

    await callback.message.edit_text(
        "📣 <b>Reklama</b>\n\n"
        "Kimga yubormoqchisiz?",
        reply_markup=kb.as_markup(),
    )
    await callback.answer()


@router.callback_query(F.data.in_({"adm_ad_users", "adm_ad_groups", "adm_ad_all"}))
async def admin_ad_target(callback: CallbackQuery, state: FSMContext, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await callback.answer("⛔")
        return

    target = callback.data.replace("adm_ad_", "")
    await state.set_state(AdState.waiting_ad_text)
    await state.update_data(ad_target=target)
    target_labels = {"users": "foydalanuvchilar", "groups": "guruhlar", "all": "hamma"}

    await callback.message.answer(
        f"📣 <b>Reklama → {target_labels.get(target)}</b>\n\n"
        "Reklama xabarini yozing.\n"
        "📷 Rasm bilan yuborish mumkin.\n\n"
        "<i>HTML format qo'llab-quvvatlanadi</i>\n\n"
        "Bekor qilish: /cancel"
    )
    await callback.answer()


@router.message(AdState.waiting_ad_text)
async def admin_ad_text(message: Message, state: FSMContext, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await state.clear()
        return

    if message.text == "/cancel":
        await state.clear()
        await message.answer("Bekor qilindi.", reply_markup=main_menu_kb())
        return

    ad_text = message.text or message.caption or ""
    photo_id = None
    if message.photo:
        photo_id = message.photo[-1].file_id

    await state.update_data(ad_text=ad_text, ad_photo=photo_id)
    await state.set_state(AdState.confirm_ad)

    data = await state.get_data()
    target = data.get("ad_target", "all")
    target_labels = {"users": "foydalanuvchilar", "groups": "guruhlar", "all": "hamma"}

    kb = InlineKeyboardBuilder()
    kb.row(
        InlineKeyboardButton(text="✅ Yuborish", callback_data="adm_ad_send"),
        InlineKeyboardButton(text="❌ Bekor", callback_data="adm_ad_cancel"),
    )

    photo_note = "\n📷 Rasm bilan" if photo_id else ""

    await message.answer(
        f"📋 <b>Tasdiqlash</b>\n\n"
        f"📨 Kimga: <b>{target_labels.get(target, target)}</b>{photo_note}\n\n"
        f"<b>Xabar:</b>\n{ad_text}\n\n"
        "Yuborilsinmi?",
        reply_markup=kb.as_markup(),
    )


@router.callback_query(F.data == "adm_ad_send")
async def admin_ad_send(callback: CallbackQuery, state: FSMContext, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await state.clear()
        await callback.answer("⛔")
        return

    data = await state.get_data()
    await state.clear()

    ad_text = data.get("ad_text", "")
    photo_id = data.get("ad_photo")
    target = data.get("ad_target", "all")

    if not ad_text and not photo_id:
        await callback.answer("Bo'sh xabar")
        return

    bot = callback.bot
    sent = 0
    failed = 0

    progress = await callback.message.answer("📤 Reklama yuborilmoqda...")

    chat_ids = []

    async with async_session() as db:
        if target in ("users", "all"):
            result = await db.execute(
                select(User.telegram_id).where(
                    User.telegram_id.isnot(None),
                    User.is_active.is_(True),
                    User.is_deleted.is_(False),
                )
            )
            chat_ids.extend([row[0] for row in result.all()])

        if target in ("groups", "all"):
            result = await db.execute(
                select(BotGroup.chat_id).where(BotGroup.is_active.is_(True))
            )
            chat_ids.extend([row[0] for row in result.all()])

    for chat_id in chat_ids:
        try:
            if photo_id:
                await bot.send_photo(chat_id=chat_id, photo=photo_id, caption=ad_text, parse_mode="HTML")
            else:
                await bot.send_message(chat_id=chat_id, text=ad_text, parse_mode="HTML")
            sent += 1
        except Exception:
            failed += 1

    await progress.edit_text(
        "✅ <b>Reklama yuborildi</b>\n\n"
        f"✅ Yuborildi: <b>{sent}</b>\n"
        f"❌ Xatolik: <b>{failed}</b>"
    )
    await callback.answer()


@router.callback_query(F.data == "adm_ad_cancel")
async def admin_ad_cancel(callback: CallbackQuery, state: FSMContext, **kwargs) -> None:
    await state.clear()
    await callback.message.edit_text("Bekor qilindi.")
    await callback.answer()


# ─── DM to user ───

@router.callback_query(F.data.startswith("adm_msg_"))
async def admin_dm_start(callback: CallbackQuery, state: FSMContext, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await callback.answer("⛔")
        return

    user_id = int(callback.data.replace("adm_msg_", ""))
    await state.set_state(DmState.waiting_dm)
    await state.update_data(dm_user_id=user_id)
    await callback.message.answer(
        "💬 <b>Xabar yuborish</b>\n\n"
        "Foydalanuvchiga yuboriladigan\n"
        "xabarni yozing:\n\n"
        "Bekor: /cancel"
    )
    await callback.answer()


@router.message(DmState.waiting_dm)
async def admin_dm_send(message: Message, state: FSMContext, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await state.clear()
        return

    if message.text == "/cancel":
        await state.clear()
        await message.answer("Bekor qilindi.", reply_markup=main_menu_kb())
        return

    data = await state.get_data()
    await state.clear()

    user_id = data.get("dm_user_id")

    async with async_session() as db:
        user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()

    if not user or not user.telegram_id:
        await message.answer("Foydalanuvchi topilmadi yoki Telegram ulanmagan.")
        return

    try:
        await message.bot.send_message(
            chat_id=user.telegram_id,
            text=f"📩 <b>Admin xabari</b>\n\n{message.text}",
            parse_mode="HTML",
        )
        await message.answer(f"✅ Xabar <b>{user.full_name}</b>ga yuborildi!")
    except Exception as e:
        await message.answer(f"❌ Xatolik: {str(e)[:100]}")


# ─── Back to admin ───

@router.callback_query(F.data == "adm_back")
async def admin_back(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not _is_admin(db_user):
        await callback.answer("⛔")
        return

    role = "👑 Superadmin" if db_user.is_superadmin else "🛡 Admin"

    await callback.message.edit_text(
        f"🛡 <b>Admin panel</b>\n\n"
        f"{role} · <b>{db_user.full_name}</b>\n\n"
        "Quyidagi amallarni tanlang:",
        reply_markup=_admin_kb().as_markup(),
    )
    await callback.answer()


# ─── Cancel command ───

@router.message(Command("cancel"))
async def cmd_cancel(message: Message, state: FSMContext, **kwargs) -> None:
    await state.clear()
    await message.answer("Bekor qilindi.", reply_markup=main_menu_kb())
