"""Rule-based tender document checker — no external AI needed."""

import logging
import re
from dataclasses import dataclass, field
from typing import Optional

import fitz

from app.exceptions import ValidationException

logger = logging.getLogger(__name__)


@dataclass
class CheckResult:
    name: str
    name_uz: str
    found: bool
    required: bool
    category: str
    matches: list[str] = field(default_factory=list)
    notes: str = ""


REQUIREMENT_RULES = [
    {
        "name": "license",
        "name_uz": "Litsenziya",
        "category": "legal",
        "required": True,
        "patterns": [
            r"litsenziya",
            r"лицензия",
            r"license",
            r"ruxsatnoma",
            r"разрешение",
        ],
    },
    {
        "name": "certificate",
        "name_uz": "Sertifikat / Guvohnoma",
        "category": "legal",
        "required": True,
        "patterns": [
            r"sertifikat",
            r"сертификат",
            r"guvohnoma",
            r"свидетельство",
            r"certificate",
        ],
    },
    {
        "name": "bank_guarantee",
        "name_uz": "Bank kafolati",
        "category": "financial",
        "required": True,
        "patterns": [
            r"bank\s*kafolat",
            r"банковская\s*гарантия",
            r"bank\s*guarantee",
            r"kafolat\s*xat",
            r"гарантийное\s*письмо",
        ],
    },
    {
        "name": "tax_clearance",
        "name_uz": "Soliq qarzdorligi yo'qligi",
        "category": "financial",
        "required": True,
        "patterns": [
            r"soliq.*ma'lumotnoma",
            r"soliq.*qarzdorlik",
            r"налоговая.*справка",
            r"справк.*задолженност",
            r"tax\s*clearance",
            r"soliq\s*to'lov",
        ],
    },
    {
        "name": "financial_report",
        "name_uz": "Moliyaviy hisobot",
        "category": "financial",
        "required": True,
        "patterns": [
            r"moliyaviy\s*hisobot",
            r"финансов.*отчет",
            r"buxgalteriya\s*balans",
            r"бухгалтерский\s*баланс",
            r"financial\s*(report|statement)",
        ],
    },
    {
        "name": "technical_proposal",
        "name_uz": "Texnik taklif",
        "category": "proposal",
        "required": True,
        "patterns": [
            r"texnik\s*taklif",
            r"техническ.*предложени",
            r"technical\s*proposal",
            r"texnik\s*spetsifikatsiya",
            r"техническ.*спецификаци",
        ],
    },
    {
        "name": "price_proposal",
        "name_uz": "Narx taklifi",
        "category": "proposal",
        "required": True,
        "patterns": [
            r"narx\s*taklif",
            r"ценовое\s*предложени",
            r"price\s*proposal",
            r"smeta",
            r"смета",
            r"калькуляция",
        ],
    },
    {
        "name": "company_info",
        "name_uz": "Kompaniya ma'lumotlari",
        "category": "documents",
        "required": True,
        "patterns": [
            r"ishtirokchi.*ma'lumot",
            r"сведения.*участник",
            r"korxona.*ma'lumot",
            r"реквизиты",
            r"stir",
            r"инн",
        ],
    },
    {
        "name": "experience",
        "name_uz": "Ish tajribasi",
        "category": "qualification",
        "required": False,
        "patterns": [
            r"ish\s*tajriba",
            r"опыт\s*работ",
            r"experience",
            r"portfel",
            r"портфель",
            r"bajarilgan\s*ish",
            r"выполненн.*работ",
        ],
    },
    {
        "name": "staff_qualification",
        "name_uz": "Xodimlar malakasi",
        "category": "qualification",
        "required": False,
        "patterns": [
            r"xodim.*malaka",
            r"квалификация.*персонал",
            r"mutaxassis",
            r"специалист",
            r"kadr",
            r"кадр",
            r"diplom",
            r"диплом",
        ],
    },
    {
        "name": "equipment",
        "name_uz": "Texnik jihozlar",
        "category": "qualification",
        "required": False,
        "patterns": [
            r"texnik.*jihozla",
            r"техническ.*оборудовани",
            r"mashina.*mexanizm",
            r"машин.*механизм",
            r"equipment",
            r"uskunalar",
        ],
    },
    {
        "name": "deadline",
        "name_uz": "Topshirish muddati",
        "category": "dates",
        "required": True,
        "patterns": [
            r"muddat",
            r"срок.*подач",
            r"deadline",
            r"oxirgi\s*sana",
            r"крайний\s*срок",
            r"topshir.*muddat",
        ],
    },
    {
        "name": "warranty",
        "name_uz": "Kafolat muddati",
        "category": "terms",
        "required": False,
        "patterns": [
            r"kafolat\s*muddat",
            r"гарантийный\s*срок",
            r"warranty",
            r"kafolat\s*davr",
        ],
    },
    {
        "name": "delivery_terms",
        "name_uz": "Yetkazib berish shartlari",
        "category": "terms",
        "required": False,
        "patterns": [
            r"yetkazib\s*berish",
            r"условия\s*поставки",
            r"delivery",
            r"logistika",
            r"доставка",
        ],
    },
    {
        "name": "penalty",
        "name_uz": "Jarima / Penya",
        "category": "terms",
        "required": False,
        "patterns": [
            r"jarima",
            r"штраф",
            r"penya",
            r"пеня",
            r"penalty",
            r"неустойка",
        ],
    },
    {
        "name": "power_of_attorney",
        "name_uz": "Ishonchnoma",
        "category": "legal",
        "required": False,
        "patterns": [
            r"ishonchnoma",
            r"доверенность",
            r"power\s*of\s*attorney",
            r"vakolat",
        ],
    },
]

DATE_PATTERNS = [
    r"\d{2}[./]\d{2}[./]\d{4}",
    r"\d{4}[.-]\d{2}[.-]\d{2}",
    r"\d{1,2}\s*(yanvar|fevral|mart|aprel|may|iyun|iyul|avgust|sentabr|oktabr|noyabr|dekabr)\s*\d{4}",
    r"\d{1,2}\s*(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s*\d{4}",
]

AMOUNT_PATTERNS = [
    r"(\d[\d\s.,]*)\s*(so'm|сум|sum|uzs|UZS)",
    r"(\d[\d\s.,]*)\s*(mln|mlrd|ming|тыс|млн|млрд)",
]


class DocumentChecker:
    """Rule-based tender document checker."""

    def extract_text(self, file_path: str) -> str:
        try:
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text() + "\n"
            doc.close()
            return text.strip()
        except Exception as e:
            logger.error("PDF extraction failed: %s", str(e))
            raise ValidationException(f"PDF faylni o'qib bo'lmadi: {str(e)}")

    def check_requirements(self, text: str) -> list[CheckResult]:
        text_lower = text.lower()
        results = []

        for rule in REQUIREMENT_RULES:
            matches = []
            for pattern in rule["patterns"]:
                found = re.findall(pattern, text_lower)
                if found:
                    for m in found[:3]:
                        ctx = self._get_context(text_lower, m if isinstance(m, str) else m, 60)
                        if ctx and ctx not in matches:
                            matches.append(ctx)

            results.append(CheckResult(
                name=rule["name"],
                name_uz=rule["name_uz"],
                found=len(matches) > 0,
                required=rule["required"],
                category=rule["category"],
                matches=matches[:3],
            ))

        return results

    def extract_dates(self, text: str) -> list[str]:
        dates = []
        for pattern in DATE_PATTERNS:
            found = re.findall(pattern, text, re.IGNORECASE)
            for d in found:
                date_str = d if isinstance(d, str) else d[0] if isinstance(d, tuple) else str(d)
                if date_str not in dates:
                    dates.append(date_str)
        return dates[:20]

    def extract_amounts(self, text: str) -> list[str]:
        amounts = []
        for pattern in AMOUNT_PATTERNS:
            found = re.findall(pattern, text, re.IGNORECASE)
            for match in found:
                amount_str = f"{match[0].strip()} {match[1]}" if isinstance(match, tuple) else str(match)
                if amount_str not in amounts:
                    amounts.append(amount_str)
        return amounts[:10]

    def get_word_count(self, text: str) -> int:
        return len(text.split())

    def analyze(self, file_path: str) -> dict:
        text = self.extract_text(file_path)

        if len(text) < 50:
            raise ValidationException("PDF fayl juda kam matn o'z ichiga oladi")

        doc = fitz.open(file_path)
        total_pages = len(doc)
        doc.close()

        requirements = self.check_requirements(text)
        dates = self.extract_dates(text)
        amounts = self.extract_amounts(text)

        found_required = sum(1 for r in requirements if r.found and r.required)
        total_required = sum(1 for r in requirements if r.required)
        found_optional = sum(1 for r in requirements if r.found and not r.required)
        total_optional = sum(1 for r in requirements if not r.required)

        completeness = round(found_required / total_required * 100) if total_required > 0 else 0

        missing_required = [r for r in requirements if r.required and not r.found]
        missing_optional = [r for r in requirements if not r.required and not r.found]

        risk_level = "past"
        if len(missing_required) == 0:
            risk_level = "past"
        elif len(missing_required) <= 2:
            risk_level = "o'rta"
        else:
            risk_level = "yuqori"

        tips = []
        if missing_required:
            tips.append(f"{len(missing_required)} ta majburiy talab hujjatda topilmadi — diqqat bilan tekshiring")
        if not any(r.name == "deadline" and r.found for r in requirements):
            tips.append("Topshirish muddati aniq ko'rsatilmagan — tashkilotdan so'rang")
        if not any(r.name == "bank_guarantee" and r.found for r in requirements):
            tips.append("Bank kafolati haqida ma'lumot topilmadi")
        if completeness == 100:
            tips.append("Barcha majburiy talablar topildi — hujjatlaringizni tayyorlashingiz mumkin")

        return {
            "total_pages": total_pages,
            "word_count": self.get_word_count(text),
            "completeness_pct": completeness,
            "risk_level": risk_level,
            "found_required": found_required,
            "total_required": total_required,
            "found_optional": found_optional,
            "total_optional": total_optional,
            "requirements": [
                {
                    "name": r.name,
                    "name_uz": r.name_uz,
                    "found": r.found,
                    "required": r.required,
                    "category": r.category,
                    "matches": r.matches,
                }
                for r in requirements
            ],
            "missing_required": [
                {"name": r.name, "name_uz": r.name_uz, "category": r.category}
                for r in missing_required
            ],
            "missing_optional": [
                {"name": r.name, "name_uz": r.name_uz, "category": r.category}
                for r in missing_optional
            ],
            "dates_found": dates,
            "amounts_found": amounts,
            "tips": tips,
        }

    def _get_context(self, text: str, match: str, window: int = 60) -> str:
        idx = text.find(match)
        if idx == -1:
            return ""
        start = max(0, idx - window)
        end = min(len(text), idx + len(match) + window)
        snippet = text[start:end].replace("\n", " ").strip()
        return f"...{snippet}..."
