"""Analytics, competitor analysis, pricing, and map handlers — real DB."""

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, InlineKeyboardButton, Message
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy import Float as SAFloat, case, func, select

from app.database import async_session
from app.models.tenders.tender import Tender
from app.models.tenders.tender_application import TenderApplication
from app.models.tenders.tender_result import TenderResult
from app.models.auth.user import User
from bot.keyboards.inline import competitor_kb, region_map_kb

router = Router()

REGION_NAMES = {
    "tashkent_city": "Toshkent shahri", "tashkent_region": "Toshkent viloyati",
    "andijan": "Andijon", "bukhara": "Buxoro", "fergana": "Farg'ona",
    "jizzakh": "Jizzax", "kashkadarya": "Qashqadaryo", "khorezm": "Xorazm",
    "namangan": "Namangan", "navoi": "Navoiy", "samarkand": "Samarqand",
    "sirdarya": "Sirdaryo", "surkhandarya": "Surxondaryo",
    "karakalpakstan": "Qoraqalpog'iston",
}


def _fmt(amount: float | None) -> str:
    if not amount:
        return "—"
    if amount >= 1e9:
        return f"{amount/1e9:.1f} mlrd"
    if amount >= 1e6:
        return f"{amount/1e6:.1f} mln"
    if amount >= 1e3:
        return f"{amount/1e3:.0f} ming"
    return f"{amount:.0f}"


def _bar(value: int, max_val: int, length: int = 10) -> str:
    if max_val <= 0:
        return "░" * length
    filled = round(value / max_val * length)
    return "▓" * filled + "░" * (length - filled)


@router.message(F.text == "📊 Tahlil")
@router.message(Command("stats"))
async def cmd_stats(message: Message, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await message.answer("Avval akkauntingizni ulang: /link")
        return

    async with async_session() as db:
        total = (await db.execute(
            select(func.count(Tender.id)).where(Tender.is_deleted.is_(False))
        )).scalar() or 0

        active = (await db.execute(
            select(func.count(Tender.id)).where(
                Tender.is_deleted.is_(False), Tender.status == "active"
            )
        )).scalar() or 0

        avg_amount = (await db.execute(
            select(func.avg(Tender.amount).cast(SAFloat)).where(
                Tender.is_deleted.is_(False), Tender.amount > 0
            )
        )).scalar() or 0

        my_apps = (await db.execute(
            select(func.count(TenderApplication.id)).where(
                TenderApplication.user_id == db_user.id
            )
        )).scalar() or 0

        my_won = (await db.execute(
            select(func.count(TenderApplication.id)).where(
                TenderApplication.user_id == db_user.id,
                TenderApplication.result == "won",
            )
        )).scalar() or 0

        my_lost = (await db.execute(
            select(func.count(TenderApplication.id)).where(
                TenderApplication.user_id == db_user.id,
                TenderApplication.result == "lost",
            )
        )).scalar() or 0

    decided = my_won + my_lost
    win_rate = round(my_won / decided * 100) if decided > 0 else 0
    win_rate_str = f"{win_rate}%" if decided > 0 else "—"

    kb = InlineKeyboardBuilder()
    kb.row(
        InlineKeyboardButton(text="🗺 Xarita", callback_data="menu_map"),
        InlineKeyboardButton(text="📋 Tenderlar", callback_data="menu_tenders"),
    )
    kb.row(InlineKeyboardButton(text="🏠 Bosh menyu", callback_data="menu_home"))

    await message.answer(
        "📊 <b>Statistika</b>\n\n"
        "<b>Platforma</b>\n"
        f"📋 Jami tenderlar: <b>{total:,}</b>\n"
        f"🟢 Faol: <b>{active:,}</b>\n"
        f"💰 O'rtacha: <b>{_fmt(avg_amount)} UZS</b>\n\n"
        "<b>Sizning natijalaringiz</b>\n"
        f"📝 Arizalar: <b>{my_apps}</b>\n"
        f"🏆 Yutilgan: <b>{my_won}</b>\n"
        f"❌ Yutqazilgan: <b>{my_lost}</b>\n"
        f"📈 Win rate: <b>{win_rate_str}</b>\n"
        f"{_bar(win_rate, 100, 15)} {win_rate_str}",
        reply_markup=kb.as_markup(),
    )


@router.callback_query(F.data.startswith("comp_"))
async def show_competitors(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await callback.answer("Akkaunt ulanmagan")
        return

    tender_id = int(callback.data.replace("comp_", ""))

    async with async_session() as db:
        tender = (await db.execute(
            select(Tender).where(Tender.id == tender_id)
        )).scalar_one_or_none()

        if not tender:
            await callback.answer("Tender topilmadi")
            return

        if tender.category:
            comp_q = (
                select(
                    TenderResult.winner_name,
                    func.count(TenderResult.id).label("wins"),
                    func.avg(TenderResult.winning_amount.cast(SAFloat)).label("avg_amount"),
                )
                .join(Tender, TenderResult.tender_id == Tender.id)
                .where(Tender.category == tender.category)
                .group_by(TenderResult.winner_name)
                .order_by(func.count(TenderResult.id).desc())
                .limit(5)
            )
            rows = (await db.execute(comp_q)).all()
        else:
            rows = []

    if not rows:
        text = (
            f"👥 <b>Raqobatchilar #{tender_id}</b>\n\n"
            "Bu kategoriyada raqobatchi\n"
            "ma'lumotlari topilmadi."
        )
    else:
        medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"]
        max_wins = rows[0].wins if rows else 1
        lines = [
            f"👥 <b>Raqobatchilar</b>\n"
            f"📂 {tender.category}\n"
        ]
        for i, r in enumerate(rows):
            medal = medals[i] if i < len(medals) else f"{i+1}."
            lines.append(
                f"{medal} <b>{r.winner_name}</b>\n"
                f"   🏆 {r.wins} g'oliblik · 💰 {_fmt(r.avg_amount)}\n"
                f"   {_bar(r.wins, max_wins, 12)}"
            )
        text = "\n".join(lines)

    await callback.message.edit_text(text, reply_markup=competitor_kb(tender_id))
    await callback.answer()


@router.callback_query(F.data.startswith("pricing_"))
async def show_pricing(callback: CallbackQuery, db_user: User | None = None, user_plan: str = "free", **kwargs) -> None:
    if not db_user:
        await callback.answer("Akkaunt ulanmagan")
        return

    tender_id = int(callback.data.replace("pricing_", ""))

    async with async_session() as db:
        tender = (await db.execute(
            select(Tender).where(Tender.id == tender_id)
        )).scalar_one_or_none()

        if not tender:
            await callback.answer("Tender topilmadi")
            return

        if tender.category:
            price_q = (
                select(
                    func.avg(TenderResult.winning_amount.cast(SAFloat)).label("avg"),
                    func.min(TenderResult.winning_amount).label("min_amt"),
                    func.max(TenderResult.winning_amount).label("max_amt"),
                    func.count(TenderResult.id).label("cnt"),
                )
                .join(Tender, TenderResult.tender_id == Tender.id)
                .where(Tender.category == tender.category, TenderResult.winning_amount > 0)
            )
            row = (await db.execute(price_q)).one()
        else:
            row = None

    if not row or not row.cnt:
        text = (
            f"💰 <b>Narx tahlili #{tender_id}</b>\n\n"
            "Yetarli ma'lumot yo'q."
        )
    else:
        avg_price = row.avg or 0
        optimal = avg_price * 0.95
        conservative = avg_price * 0.98
        aggressive = avg_price * 0.88

        text = (
            f"💰 <b>Narx tahlili</b>\n"
            f"📂 {tender.category} · {row.cnt} ta tender\n\n"
            f"📊 O'rtacha: <b>{_fmt(avg_price)} UZS</b>\n"
            f"⬇️ Min: {_fmt(row.min_amt)} UZS\n"
            f"⬆️ Max: {_fmt(row.max_amt)} UZS\n\n"
            "<b>📌 Tavsiya narxlar:</b>\n"
            f"🟢 Konservativ: <b>{_fmt(conservative)}</b>\n"
            f"🟡 Optimal: <b>{_fmt(optimal)}</b>\n"
            f"🔴 Agressiv: <b>{_fmt(aggressive)}</b>"
        )

    kb = InlineKeyboardBuilder()
    kb.row(InlineKeyboardButton(text="« Orqaga", callback_data=f"td_{tender_id}"))

    await callback.message.edit_text(text, reply_markup=kb.as_markup())
    await callback.answer()


# ─── Map handlers ───

@router.message(Command("map"))
@router.message(F.text == "🗺 Xarita")
async def cmd_map(message: Message, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await message.answer("Avval akkauntingizni ulang: /link")
        return

    async with async_session() as db:
        stmt = (
            select(
                Tender.region,
                func.count(Tender.id).label("total"),
                func.count(case((Tender.status == "active", 1))).label("active"),
            )
            .where(Tender.is_deleted.is_(False), Tender.region.isnot(None))
            .group_by(Tender.region)
            .order_by(func.count(Tender.id).desc())
        )
        rows = (await db.execute(stmt)).all()

    if not rows:
        await message.answer(
            "🗺 <b>Tender xaritasi</b>\n\n"
            "Hududlar bo'yicha ma'lumot topilmadi."
        )
        return

    total_all = sum(r.total for r in rows)
    max_total = rows[0].total if rows else 1

    lines = [
        f"🗺 <b>Tender xaritasi</b>\n"
        f"📋 Jami: <b>{total_all}</b> ta · {len(rows)} hudud\n"
    ]

    for r in rows[:14]:
        name = REGION_NAMES.get(r.region, r.region)
        bar = _bar(r.total, max_total, 8)
        lines.append(f"📍 <b>{name}</b>\n   {bar} {r.total} ({r.active} 🟢)")

    lines.append("\n<i>Batafsil ko'rish uchun hudud tanlang:</i>")
    await message.answer("\n".join(lines), reply_markup=region_map_kb())


@router.callback_query(F.data.startswith("mapreg_"))
async def show_region_detail(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await callback.answer("Akkaunt ulanmagan")
        return

    region = callback.data.replace("mapreg_", "")
    region_name = REGION_NAMES.get(region, region)

    async with async_session() as db:
        stat_q = (
            select(
                func.count(Tender.id).label("total"),
                func.count(case((Tender.status == "active", 1))).label("active"),
                func.avg(case((Tender.amount > 0, Tender.amount), else_=None).cast(SAFloat)).label("avg"),
                func.sum(case((Tender.amount > 0, Tender.amount), else_=0).cast(SAFloat)).label("sum"),
            )
            .where(Tender.is_deleted.is_(False), Tender.region == region)
        )
        s = (await db.execute(stat_q)).one()

        tenders_q = (
            select(Tender)
            .where(Tender.is_deleted.is_(False), Tender.region == region)
            .order_by(Tender.created_at.desc())
            .limit(5)
        )
        tenders = (await db.execute(tenders_q)).scalars().all()

    lines = [
        f"📍 <b>{region_name}</b>\n\n"
        f"📋 Jami: <b>{s.total}</b>\n"
        f"🟢 Faol: <b>{s.active}</b>\n"
        f"💰 O'rtacha: <b>{_fmt(s.avg)} UZS</b>\n"
        f"💰 Umumiy: <b>{_fmt(s.sum)} UZS</b>"
    ]

    if tenders:
        lines.append("\n<b>So'nggi tenderlar:</b>")

    tenders_data = []
    for t in tenders:
        title = t.title[:55]
        amt = f" · {_fmt(t.amount)}" if t.amount else ""
        lines.append(f"📋 {title}{amt}")
        tenders_data.append({"id": t.id, "title": t.title, "amount": t.amount})

    kb = InlineKeyboardBuilder()
    for t in tenders_data:
        kb.button(text=f"📋 {t['title'][:35]}", callback_data=f"td_{t['id']}")
    kb.adjust(1)
    kb.row(InlineKeyboardButton(text="« Xaritaga qaytish", callback_data="back_map"))

    await callback.message.edit_text("\n".join(lines), reply_markup=kb.as_markup())
    await callback.answer()


@router.callback_query(F.data == "back_map")
async def back_to_map(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if db_user:
        await cmd_map(callback.message, db_user)
    await callback.answer()
