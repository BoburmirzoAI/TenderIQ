"""Uzbek language NLP utilities for text preprocessing."""

import re
from typing import Optional

UZBEK_STOP_WORDS: set[str] = {
    "va", "yoki", "uchun", "bilan", "da", "ga", "ni", "bu", "ham", "esa",
    "bo'lgan", "qilish", "amalga", "oshirish", "bo'yicha", "asosida",
    "tartibida", "ko'ra", "davomida", "ichida", "tashkil", "etish",
    "berish", "olish", "qilgan", "etgan", "bo'ladi", "kerak", "mumkin",
    "lozim", "zarur", "shart", "har", "bir", "barcha", "hamma", "o'z",
    "shu", "u", "men", "biz", "ular", "siz", "nima", "qanday", "qachon",
    "qaerda", "kim", "nega", "shunday", "bunday", "anday", "yil", "oy",
    "kun", "soat", "daqiqa", "vaqt", "davr", "muddat", "son", "miqdor",
    "hajm", "narx", "summa", "mablag", "byudjet", "moliya", "hisob",
    "to'lov", "shartnoma", "bitim", "kelishuv", "ariza", "buyurtma",
    "taklif", "murojaat", "tashkilot", "korxona", "kompaniya", "firma",
    "jamiyat", "idora", "muassasa", "davlat", "respublika", "viloyat",
    "shahar", "tuman", "hudud", "mintaqa", "bo'lib", "degan", "aynan",
    "masalan", "xususan", "shuningdek", "bundan", "tashqari", "agar",
    "chunki", "sababli", "natijada", "binoan", "muvofiq", "qaror",
    "farmon", "qonun", "nizom", "tartib", "rejasi", "dastur", "loyiha",
    "ishchi", "xodim", "mutaxassis", "mas'ul", "rahbar", "direktor",
    "boshqarma", "bo'lim", "xizmat", "faoliyat", "ish", "mehnat",
    "ning", "dan", "lar", "lik", "chi", "dagi", "lari", "ning",
}


def preprocess_text(text: Optional[str]) -> str:
    """Preprocess Uzbek text for NLP tasks."""
    if not text:
        return ""

    text = text.lower()
    text = re.sub(r"[^\w\s'ʼ]", " ", text)
    text = re.sub(r"\d+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    words = text.split()
    words = [w for w in words if w not in UZBEK_STOP_WORDS and len(w) > 2]

    return " ".join(words)


def tokenize(text: str) -> list[str]:
    """Tokenize Uzbek text into words."""
    processed = preprocess_text(text)
    return processed.split() if processed else []


def normalize(text: str) -> str:
    """Normalize Uzbek text variants."""
    text = text.replace("ʼ", "'")
    text = text.replace("‘", "'").replace("’", "'")
    text = text.replace("o'", "oʻ").replace("g'", "gʻ")
    return text
