"""Inline keyboard builders."""

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder

from app.constants import TenderCategory, UzbekRegion


# ─── Main menu inline ───

def main_inline_kb(is_admin: bool = False) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.row(
        InlineKeyboardButton(text="📋 Tenderlar", callback_data="menu_tenders"),
        InlineKeyboardButton(text="🔍 Qidirish", callback_data="menu_search"),
    )
    kb.row(
        InlineKeyboardButton(text="🏢 Kompaniya", callback_data="menu_profile"),
        InlineKeyboardButton(text="💾 Saqlanganlar", callback_data="menu_saved"),
    )
    kb.row(
        InlineKeyboardButton(text="📊 Statistika", callback_data="menu_stats"),
        InlineKeyboardButton(text="🗺 Xarita", callback_data="menu_map"),
    )
    kb.row(
        InlineKeyboardButton(text="📄 Hujjat tekshiruv", callback_data="menu_docs"),
        InlineKeyboardButton(text="💳 Obuna", callback_data="menu_plan"),
    )
    if is_admin:
        kb.row(InlineKeyboardButton(text="🛡 Admin panel", callback_data="menu_admin"))
    return kb.as_markup()


# ─── Tender ───

def tender_actions_kb(tender_id: int, is_saved: bool = False) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    save_text = "💔 Olib tashlash" if is_saved else "❤️ Saqlash"
    kb.row(
        InlineKeyboardButton(text=save_text, callback_data=f"save_{tender_id}"),
        InlineKeyboardButton(text="👥 Raqobatchilar", callback_data=f"comp_{tender_id}"),
    )
    kb.row(
        InlineKeyboardButton(text="💰 Narx tahlili", callback_data=f"pricing_{tender_id}"),
        InlineKeyboardButton(text="🔗 Manbada", callback_data=f"src_{tender_id}"),
    )
    kb.row(InlineKeyboardButton(text="« Orqaga", callback_data="back_tenders"))
    return kb.as_markup()


def tender_list_kb(tenders: list[dict], page: int = 1, total_pages: int = 1) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    for t in tenders:
        tid = t["id"]
        title = t.get("title", "")[:38]
        amount = t.get("amount")
        if amount:
            if amount >= 1e9:
                amt = f"{amount/1e9:.1f}mlrd"
            elif amount >= 1e6:
                amt = f"{amount/1e6:.0f}mln"
            else:
                amt = ""
            label = f"{'💰' if amt else '📋'} {title} {amt}"
        else:
            label = f"📋 {title}"
        kb.button(text=label[:55], callback_data=f"td_{tid}")
    kb.adjust(1)

    nav = []
    if page > 1:
        nav.append(InlineKeyboardButton(text="« Oldingi", callback_data=f"tpage_{page - 1}"))
    nav.append(InlineKeyboardButton(text=f"· {page}/{total_pages} ·", callback_data="noop"))
    if page < total_pages:
        nav.append(InlineKeyboardButton(text="Keyingi »", callback_data=f"tpage_{page + 1}"))
    if nav:
        kb.row(*nav)
    kb.row(InlineKeyboardButton(text="🏠 Bosh menyu", callback_data="menu_home"))
    return kb.as_markup()


# ─── Category / Region select ───

CATEGORY_EMOJI = {
    "construction": "🏗", "it": "💻", "medical": "🏥", "education": "🎓",
    "food": "🍽", "transport": "🚛", "energy": "⚡", "agriculture": "🌾",
    "consulting": "💼", "other": "📦",
}

CATEGORY_LABELS = {
    "construction": "Qurilish", "it": "IT", "medical": "Tibbiyot", "education": "Ta'lim",
    "food": "Oziq-ovqat", "transport": "Transport", "energy": "Energetika",
    "agriculture": "Qishloq xo'jaligi", "consulting": "Konsalting", "other": "Boshqa",
}


def category_kb(selected: list[str] | None = None) -> InlineKeyboardMarkup:
    selected = selected or []
    kb = InlineKeyboardBuilder()
    for cat in TenderCategory:
        emoji = CATEGORY_EMOJI.get(cat.value, "📦")
        label = CATEGORY_LABELS.get(cat.value, cat.value)
        check = " ✓" if cat.value in selected else ""
        kb.button(text=f"{emoji} {label}{check}", callback_data=f"cat_{cat.value}")
    kb.button(text="✅ Tayyor", callback_data="cat_done")
    kb.adjust(2)
    return kb.as_markup()


REGION_EMOJI = {
    "tashkent_city": "🏙", "tashkent_region": "🏘", "samarkand": "🕌",
    "bukhara": "🕌", "fergana": "🏔", "andijan": "🏔", "namangan": "🏔",
    "kashkadarya": "🌄", "surkhandarya": "🌄", "jizzakh": "🌾",
    "sirdarya": "🌊", "navoi": "🏜", "khorezm": "🏛", "karakalpakstan": "🏜",
}

REGION_LABELS = {
    "tashkent_city": "Toshkent sh.", "tashkent_region": "Toshkent v.",
    "samarkand": "Samarqand", "bukhara": "Buxoro", "fergana": "Farg'ona",
    "andijan": "Andijon", "namangan": "Namangan", "kashkadarya": "Qashqadaryo",
    "surkhandarya": "Surxondaryo", "jizzakh": "Jizzax", "sirdarya": "Sirdaryo",
    "navoi": "Navoiy", "khorezm": "Xorazm", "karakalpakstan": "Qoraqalpog'iston",
}


def region_kb(selected: list[str] | None = None) -> InlineKeyboardMarkup:
    selected = selected or []
    kb = InlineKeyboardBuilder()
    for reg in UzbekRegion:
        emoji = REGION_EMOJI.get(reg.value, "📍")
        label = REGION_LABELS.get(reg.value, reg.value)
        check = " ✓" if reg.value in selected else ""
        kb.button(text=f"{emoji} {label}{check}", callback_data=f"reg_{reg.value}")
    kb.button(text="✅ Tayyor", callback_data="reg_done")
    kb.adjust(2)
    return kb.as_markup()


# ─── Pagination ───

def pagination_kb(page: int, total_pages: int, prefix: str = "page") -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    btns = []
    if page > 1:
        btns.append(InlineKeyboardButton(text="« Oldingi", callback_data=f"{prefix}_{page - 1}"))
    btns.append(InlineKeyboardButton(text=f"· {page}/{total_pages} ·", callback_data="noop"))
    if page < total_pages:
        btns.append(InlineKeyboardButton(text="Keyingi »", callback_data=f"{prefix}_{page + 1}"))
    kb.row(*btns)
    return kb.as_markup()


# ─── Subscription ───

def upgrade_kb() -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.button(text="🥈 PRO — 299,000 UZS/oy", callback_data="upgrade_pro")
    kb.button(text="🥇 BUSINESS — 990,000 UZS/oy", callback_data="upgrade_business")
    kb.adjust(1)
    return kb.as_markup()


# ─── Competitor ───

def competitor_kb(tender_id: int) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.button(text="📈 Narx tarixi", callback_data=f"price_hist_{tender_id}")
    kb.button(text="« Orqaga", callback_data=f"td_{tender_id}")
    kb.adjust(1)
    return kb.as_markup()


# ─── Map regions ───

def region_map_kb() -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    regions = {
        "tashkent_city": "🏙 Toshkent sh.",
        "tashkent_region": "🏘 Toshkent v.",
        "samarkand": "🕌 Samarqand",
        "bukhara": "🕌 Buxoro",
        "fergana": "🏔 Farg'ona",
        "andijan": "🏔 Andijon",
        "namangan": "🏔 Namangan",
        "kashkadarya": "🌄 Qashqadaryo",
        "surkhandarya": "🌄 Surxondaryo",
        "jizzakh": "🌾 Jizzax",
        "sirdarya": "🌊 Sirdaryo",
        "navoi": "🏜 Navoiy",
        "khorezm": "🏛 Xorazm",
        "karakalpakstan": "🏜 Qoraqalpog'iston",
    }
    for key, label in regions.items():
        kb.button(text=label, callback_data=f"mapreg_{key}")
    kb.adjust(2)
    kb.row(InlineKeyboardButton(text="🏠 Bosh menyu", callback_data="menu_home"))
    return kb.as_markup()


# ─── Link ───

def link_account_kb() -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.button(text="🔗 Akkauntni ulash", callback_data="menu_link")
    return kb.as_markup()


# ─── Settings inline ───

def settings_inline_kb(user) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    tg_status = "✅" if user.notify_telegram else "❌"
    kb.button(text=f"📱 Telegram xabarlar: {tg_status}", callback_data="set_toggle_tg")
    kb.button(text=f"🌐 Til: {user.language.upper()}", callback_data="set_lang")
    kb.adjust(1)
    notif_items = [
        ("Yangi tenderlar", user.notify_new_tenders, "set_n_new"),
        ("Mos tenderlar", user.notify_match, "set_n_match"),
        ("Muddat eslatma", user.notify_deadline, "set_n_deadline"),
        ("Natijalar", user.notify_results, "set_n_results"),
    ]
    for label, on, cb in notif_items:
        kb.button(text=f"{'✅' if on else '❌'} {label}", callback_data=cb)
    kb.adjust(2)
    kb.row(InlineKeyboardButton(text="🏠 Bosh menyu", callback_data="menu_home"))
    return kb.as_markup()
