"""Tender browsing, search, and detail handlers."""

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, Message
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

from app.database import async_session
from app.models.tender import Tender
from app.models.tender_match import TenderMatch
from app.models.user import User
from bot.keyboards.inline import tender_actions_kb, tender_list_kb
from bot.keyboards.reply import main_menu_kb

router = Router()

PER_PAGE = 5

STATUS_EMOJI = {"active": "🟢", "closed": "🔴", "awarded": "🏆", "cancelled": "⚫", "draft": "⚪"}


class SearchState(StatesGroup):
    waiting_query = State()


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


def _format_tender_card(t, index: int = 0) -> str:
    status = STATUS_EMOJI.get(t.status, "⚪")
    deadline = t.deadline.strftime("%d.%m.%Y") if t.deadline else "—"
    amount = _fmt(t.amount)
    title = t.title[:70]

    return (
        f"\n{status} <b>{title}</b>\n"
        f"🏢 {t.organization or '—'}\n"
        f"📍 {t.region or '—'} · 📂 {t.category or '—'}\n"
        f"💰 {amount} {t.currency} · 📅 {deadline}"
    )


@router.message(Command("tenders"))
@router.message(F.text == "📋 Tenderlar")
async def cmd_tenders(message: Message, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await message.answer("Avval akkauntingizni ulang: /link")
        return
    await _show_tenders_page(message, db_user, page=1)


async def _show_tenders_page(message: Message, db_user: User, page: int = 1, edit: bool = False) -> None:
    async with async_session() as db:
        conditions = [Tender.is_deleted.is_(False), Tender.status == "active"]
        total = (await db.execute(select(func.count(Tender.id)).where(*conditions))).scalar() or 0

        if total == 0:
            text = (
                "📋 <b>Tenderlar</b>\n\n"
                "Hozircha faol tender topilmadi.\n"
                "🔍 /search orqali qidiring"
            )
            if edit:
                await message.edit_text(text)
            else:
                await message.answer(text)
            return

        total_pages = max(1, (total + PER_PAGE - 1) // PER_PAGE)
        page = min(page, total_pages)

        stmt = (
            select(Tender)
            .where(*conditions)
            .order_by(Tender.deadline.asc().nullslast(), Tender.created_at.desc())
            .offset((page - 1) * PER_PAGE)
            .limit(PER_PAGE)
        )
        rows = (await db.execute(stmt)).scalars().all()

    tenders_data = []
    lines = [f"📋 <b>Faol tenderlar</b> ({total})\n"]
    for t in rows:
        lines.append(_format_tender_card(t))
        tenders_data.append({"id": t.id, "title": t.title, "amount": t.amount})

    text = "\n".join(lines)
    kb = tender_list_kb(tenders_data, page, total_pages)

    if edit:
        try:
            await message.edit_text(text, reply_markup=kb)
        except Exception:
            await message.answer(text, reply_markup=kb)
    else:
        await message.answer(text, reply_markup=kb)


@router.callback_query(F.data.startswith("tpage_"))
async def handle_tender_pagination(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await callback.answer("Akkaunt ulanmagan")
        return
    page = int(callback.data.replace("tpage_", ""))
    await _show_tenders_page(callback.message, db_user, page, edit=True)
    await callback.answer()


@router.callback_query(F.data.startswith("td_"))
async def show_tender_detail(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    tender_id = int(callback.data.replace("td_", ""))

    async with async_session() as db:
        tender = (await db.execute(
            select(Tender).where(Tender.id == tender_id, Tender.is_deleted.is_(False))
        )).scalar_one_or_none()

    if not tender:
        await callback.answer("Tender topilmadi")
        return

    status = STATUS_EMOJI.get(tender.status, "⚪")
    deadline = tender.deadline.strftime("%d.%m.%Y %H:%M") if tender.deadline else "—"

    text = (
        f"{status} <b>Tender #{tender_id}</b>\n\n"
        f"<b>{tender.title}</b>\n\n"
        f"🏢 <b>Tashkilot:</b> {tender.organization or '—'}\n"
        f"📂 <b>Kategoriya:</b> {tender.category or '—'}\n"
        f"📍 <b>Hudud:</b> {tender.region or '—'}\n"
        f"💰 <b>Summa:</b> {_fmt(tender.amount)} {tender.currency}\n"
        f"📅 <b>Muddat:</b> {deadline}\n"
        f"📊 <b>Status:</b> {tender.status}\n"
    )

    if tender.requirements:
        req_text = tender.requirements[:400].replace("<", "&lt;")
        text += f"\n📋 <b>Talablar:</b>\n<i>{req_text}</i>\n"

    if tender.url:
        text += f"\n🔗 <a href='{tender.url}'>Manbada ochish</a>"

    await callback.message.edit_text(text, reply_markup=tender_actions_kb(tender_id))
    await callback.answer()


@router.callback_query(F.data.startswith("src_"))
async def show_source(callback: CallbackQuery, **kwargs) -> None:
    tender_id = int(callback.data.replace("src_", ""))
    async with async_session() as db:
        tender = (await db.execute(
            select(Tender).where(Tender.id == tender_id)
        )).scalar_one_or_none()

    if tender and tender.url:
        await callback.answer(f"Havola: {tender.url}", show_alert=True)
    else:
        await callback.answer("Manba havolasi mavjud emas")


@router.callback_query(F.data == "back_tenders")
async def back_to_tenders(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if db_user:
        await _show_tenders_page(callback.message, db_user, 1, edit=True)
    await callback.answer()


@router.message(Command("search"))
@router.message(F.text == "🔍 Qidirish")
async def cmd_search(message: Message, state: FSMContext, db_user: User | None = None, **kwargs) -> None:
    if not db_user:
        await message.answer("Avval akkauntingizni ulang: /link")
        return
    await state.set_state(SearchState.waiting_query)
    await message.answer(
        "🔍 <b>Qidiruv</b>\n\n"
        "Kalit so'zni kiriting:\n"
        "<i>masalan: qurilish Toshkent, IT, tibbiyot</i>"
    )


@router.message(SearchState.waiting_query)
async def process_search(message: Message, state: FSMContext, db_user: User | None = None, **kwargs) -> None:
    await state.clear()
    query = (message.text or "").strip()
    if not query or len(query) < 2:
        await message.answer("Kamida 2 ta belgi kiriting.", reply_markup=main_menu_kb())
        return

    search_term = f"%{query}%"

    async with async_session() as db:
        stmt = (
            select(Tender)
            .where(Tender.is_deleted.is_(False), Tender.search_text.ilike(search_term))
            .order_by(Tender.created_at.desc())
            .limit(10)
        )
        rows = (await db.execute(stmt)).scalars().all()

    if not rows:
        await message.answer(
            f"🔍 <b>«{query}»</b> — natija topilmadi\n\n"
            "Boshqa so'z bilan urinib ko'ring: /search",
            reply_markup=main_menu_kb(),
        )
        return

    tenders_data = []
    lines = [f"🔍 <b>«{query}»</b> — {len(rows)} natija\n"]
    for t in rows:
        lines.append(_format_tender_card(t))
        tenders_data.append({"id": t.id, "title": t.title, "amount": t.amount})

    await message.answer("\n".join(lines), reply_markup=tender_list_kb(tenders_data))


@router.message(Command("saved"))
async def cmd_saved(message: Message, db_user: User | None = None, **kwargs) -> None:
    if not db_user or not db_user.company:
        await message.answer("Avval akkauntingizni ulang: /link")
        return

    async with async_session() as db:
        stmt = (
            select(TenderMatch)
            .options(joinedload(TenderMatch.tender))
            .where(
                TenderMatch.company_id == db_user.company.id,
                TenderMatch.is_saved.is_(True),
            )
            .order_by(TenderMatch.created_at.desc())
            .limit(10)
        )
        rows = (await db.execute(stmt)).unique().scalars().all()

    if not rows:
        await message.answer(
            "❤️ <b>Saqlanganlar</b>\n\n"
            "Hali saqlangan tender yo'q.\n"
            "Tender tafsilotlarida ❤️ tugmasini bosing."
        )
        return

    tenders_data = []
    lines = [f"❤️ <b>Saqlanganlar</b> ({len(rows)})\n"]
    for m in rows:
        t = m.tender
        lines.append(_format_tender_card(t))
        tenders_data.append({"id": t.id, "title": t.title, "amount": t.amount})

    await message.answer("\n".join(lines), reply_markup=tender_list_kb(tenders_data))


@router.callback_query(F.data.startswith("save_"))
async def toggle_save(callback: CallbackQuery, db_user: User | None = None, **kwargs) -> None:
    if not db_user or not db_user.company:
        await callback.answer("Akkaunt ulanmagan")
        return

    tender_id = int(callback.data.replace("save_", ""))

    async with async_session() as db:
        match = (await db.execute(
            select(TenderMatch).where(
                TenderMatch.company_id == db_user.company.id,
                TenderMatch.tender_id == tender_id,
            )
        )).scalar_one_or_none()
        if match:
            match.is_saved = not match.is_saved
            await db.commit()
            if match.is_saved:
                await callback.answer("❤️ Saqlandi!")
            else:
                await callback.answer("💔 Olib tashlandi")
        else:
            await callback.answer("Tender topilmadi")
