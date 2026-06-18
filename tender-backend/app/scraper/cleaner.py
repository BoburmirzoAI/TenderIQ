"""Data cleaning functions for scraped tender data."""

import re
from datetime import datetime
from typing import Optional

from app.constants import TenderCategory, UzbekRegion

CATEGORY_MAPPING: dict[str, str] = {
    "qurilish": TenderCategory.CONSTRUCTION.value,
    "строительство": TenderCategory.CONSTRUCTION.value,
    "construction": TenderCategory.CONSTRUCTION.value,
    "it": TenderCategory.IT.value,
    "axborot": TenderCategory.IT.value,
    "информационные": TenderCategory.IT.value,
    "tibbiyot": TenderCategory.MEDICAL.value,
    "медицин": TenderCategory.MEDICAL.value,
    "medical": TenderCategory.MEDICAL.value,
    "ta'lim": TenderCategory.EDUCATION.value,
    "образование": TenderCategory.EDUCATION.value,
    "oziq-ovqat": TenderCategory.FOOD.value,
    "продовольств": TenderCategory.FOOD.value,
    "transport": TenderCategory.TRANSPORT.value,
    "транспорт": TenderCategory.TRANSPORT.value,
    "energetika": TenderCategory.ENERGY.value,
    "энергетик": TenderCategory.ENERGY.value,
    "qishloq": TenderCategory.AGRICULTURE.value,
    "сельско": TenderCategory.AGRICULTURE.value,
    "konsalting": TenderCategory.CONSULTING.value,
    "консалтинг": TenderCategory.CONSULTING.value,
}

REGION_MAPPING: dict[str, str] = {
    "toshkent sh": UzbekRegion.TASHKENT_CITY.value,
    "toshkent shahri": UzbekRegion.TASHKENT_CITY.value,
    "ташкент город": UzbekRegion.TASHKENT_CITY.value,
    "toshkent v": UzbekRegion.TASHKENT_REGION.value,
    "toshkent viloyati": UzbekRegion.TASHKENT_REGION.value,
    "ташкент обл": UzbekRegion.TASHKENT_REGION.value,
    "andijon": UzbekRegion.ANDIJAN.value,
    "андижан": UzbekRegion.ANDIJAN.value,
    "buxoro": UzbekRegion.BUKHARA.value,
    "бухар": UzbekRegion.BUKHARA.value,
    "farg'ona": UzbekRegion.FERGANA.value,
    "ферган": UzbekRegion.FERGANA.value,
    "jizzax": UzbekRegion.JIZZAKH.value,
    "джизак": UzbekRegion.JIZZAKH.value,
    "qashqadaryo": UzbekRegion.KASHKADARYA.value,
    "кашкадар": UzbekRegion.KASHKADARYA.value,
    "xorazm": UzbekRegion.KHOREZM.value,
    "хорезм": UzbekRegion.KHOREZM.value,
    "namangan": UzbekRegion.NAMANGAN.value,
    "наманган": UzbekRegion.NAMANGAN.value,
    "navoiy": UzbekRegion.NAVOI.value,
    "навои": UzbekRegion.NAVOI.value,
    "samarqand": UzbekRegion.SAMARKAND.value,
    "самарканд": UzbekRegion.SAMARKAND.value,
    "sirdaryo": UzbekRegion.SIRDARYA.value,
    "сырдар": UzbekRegion.SIRDARYA.value,
    "surxondaryo": UzbekRegion.SURKHANDARYA.value,
    "сурхандар": UzbekRegion.SURKHANDARYA.value,
    "qoraqalpog'iston": UzbekRegion.KARAKALPAKSTAN.value,
    "каракалпак": UzbekRegion.KARAKALPAKSTAN.value,
}


def clean_amount(raw: str) -> Optional[float]:
    """Parse monetary amounts from various formats."""
    if not raw:
        return None
    cleaned = re.sub(r"[^\d.,]", "", str(raw))
    if "," in cleaned and "." not in cleaned:
        parts = cleaned.split(",")
        if all(len(p) == 3 for p in parts[1:]):
            cleaned = cleaned.replace(",", "")
        elif len(parts) == 2 and len(parts[1]) <= 2:
            cleaned = cleaned.replace(",", ".")
        else:
            cleaned = cleaned.replace(",", "")
    elif "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(",", "")
    try:
        return float(cleaned)
    except ValueError:
        return None


def clean_date(raw: str) -> Optional[datetime]:
    """Parse dates from various Uzbek and Russian formats."""
    if not raw:
        return None

    formats = [
        "%Y-%m-%d",
        "%d.%m.%Y",
        "%d/%m/%Y",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ",
        "%d.%m.%Y %H:%M",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(raw.strip(), fmt)
        except ValueError:
            continue
    return None


def clean_category(raw: str) -> str:
    """Map raw category text to a TenderCategory value."""
    if not raw:
        return TenderCategory.OTHER.value
    lower = raw.lower().strip()
    for keyword, category in CATEGORY_MAPPING.items():
        if keyword in lower:
            return category
    return TenderCategory.OTHER.value


def clean_region(raw: str) -> Optional[str]:
    """Map raw region text to a UzbekRegion value."""
    if not raw:
        return None
    lower = raw.lower().strip()
    for keyword, region in REGION_MAPPING.items():
        if keyword in lower:
            return region
    return None
