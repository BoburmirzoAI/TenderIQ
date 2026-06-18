"""Tender risk assessment using rule-based and ML scoring."""

import logging
from typing import Any

logger = logging.getLogger(__name__)


class RiskAssessmentModel:
    """Assesses multiple risk dimensions of a tender opportunity."""

    def assess(self, features: dict[str, Any]) -> dict[str, Any]:
        risks: list[dict] = []
        total_score = 0
        max_score = 0

        budget_risk = self._assess_budget_risk(features)
        risks.append(budget_risk)
        total_score += budget_risk["score"]
        max_score += 100

        deadline_risk = self._assess_deadline_risk(features)
        risks.append(deadline_risk)
        total_score += deadline_risk["score"]
        max_score += 100

        competition_risk = self._assess_competition_risk(features)
        risks.append(competition_risk)
        total_score += competition_risk["score"]
        max_score += 100

        capacity_risk = self._assess_capacity_risk(features)
        risks.append(capacity_risk)
        total_score += capacity_risk["score"]
        max_score += 100

        documentation_risk = self._assess_documentation_risk(features)
        risks.append(documentation_risk)
        total_score += documentation_risk["score"]
        max_score += 100

        market_risk = self._assess_market_risk(features)
        risks.append(market_risk)
        total_score += market_risk["score"]
        max_score += 100

        overall_score = round((total_score / max(max_score, 1)) * 100, 1)

        if overall_score <= 30:
            overall_level = "past"
            overall_label = "Past xavf"
            verdict = "Tender xavfsiz ko'rinadi. Ariza berishingiz mumkin."
        elif overall_score <= 55:
            overall_level = "o'rta"
            overall_label = "O'rtacha xavf"
            verdict = "Ba'zi xavflar mavjud. Ehtiyotkorlik bilan davom eting."
        else:
            overall_level = "yuqori"
            overall_label = "Yuqori xavf"
            verdict = "Jiddiy xavflar aniqlandi. Qaror qabul qilishdan oldin chuqur tahlil qiling."

        high_risks = [r for r in risks if r["level"] == "yuqori"]
        medium_risks = [r for r in risks if r["level"] == "o'rta"]

        recommendations = self._build_recommendations(high_risks, medium_risks, features)

        return {
            "overall_score": overall_score,
            "overall_level": overall_level,
            "overall_label": overall_label,
            "verdict": verdict,
            "risks": risks,
            "recommendations": recommendations,
            "high_risk_count": len(high_risks),
            "medium_risk_count": len(medium_risks),
            "low_risk_count": len([r for r in risks if r["level"] == "past"]),
        }

    def _assess_budget_risk(self, features: dict[str, Any]) -> dict:
        tender_amount = features.get("tender_amount", 0)
        avg_market_amount = features.get("avg_market_amount", 0)
        company_max_budget = features.get("company_max_budget", 0)

        score = 0
        details = []

        if tender_amount <= 0:
            score += 40
            details.append("Tender summasi ko'rsatilmagan")
        elif avg_market_amount > 0:
            ratio = tender_amount / avg_market_amount
            if ratio < 0.5:
                score += 50
                details.append("Tender summasi bozor o'rtachasidan 2 baravar past — dumping xavfi")
            elif ratio < 0.75:
                score += 25
                details.append("Tender summasi bozor o'rtachasidan past")
            elif ratio > 2.0:
                score += 30
                details.append("Tender summasi bozor o'rtachasidan juda yuqori — shubhali")
            else:
                details.append("Tender summasi bozor o'rtachasiga mos")

        if company_max_budget > 0 and tender_amount > company_max_budget * 1.5:
            score += 30
            details.append("Tender summasi kompaniya byudjet chegarasidan oshadi")

        return self._format_risk("Byudjet xavfi", "budget", score, details)

    def _assess_deadline_risk(self, features: dict[str, Any]) -> dict:
        days_until_deadline = features.get("days_until_deadline")
        requires_documents = features.get("requires_documents", False)
        requires_license = features.get("requires_license", False)

        score = 0
        details = []

        if days_until_deadline is None:
            score += 20
            details.append("Muddat haqida ma'lumot yo'q")
        elif days_until_deadline <= 0:
            score += 90
            details.append("Muddat o'tib ketgan!")
        elif days_until_deadline <= 3:
            score += 70
            details.append(f"Faqat {days_until_deadline} kun qoldi — juda qisqa")
            if requires_documents:
                score += 15
                details.append("Hujjatlar tayyorlash uchun vaqt yetarli emas")
        elif days_until_deadline <= 7:
            score += 40
            details.append(f"{days_until_deadline} kun qoldi — qisqa muddat")
        elif days_until_deadline <= 14:
            score += 15
            details.append(f"{days_until_deadline} kun qoldi — o'rtacha muddat")
        else:
            details.append(f"{days_until_deadline} kun qoldi — yetarli vaqt")

        if requires_license and days_until_deadline and days_until_deadline < 14:
            score += 20
            details.append("Litsenziya talab qilinadi — qisqa muddatda olish qiyin")

        return self._format_risk("Muddat xavfi", "deadline", score, details)

    def _assess_competition_risk(self, features: dict[str, Any]) -> dict:
        competitor_count = features.get("competitor_count", 0)
        category_competition = features.get("category_competition", "normal")

        score = 0
        details = []

        if competitor_count == 0:
            score += 10
            details.append("Raqobatchilar haqida ma'lumot yo'q")
        elif competitor_count <= 3:
            score += 10
            details.append(f"Kam raqobat ({competitor_count} ta ishtirokchi)")
        elif competitor_count <= 7:
            score += 30
            details.append(f"O'rtacha raqobat ({competitor_count} ta ishtirokchi)")
        elif competitor_count <= 12:
            score += 55
            details.append(f"Yuqori raqobat ({competitor_count} ta ishtirokchi)")
        else:
            score += 75
            details.append(f"Juda yuqori raqobat ({competitor_count} ta ishtirokchi)")

        if category_competition == "high":
            score += 15
            details.append("Bu kategoriyada raqobat darajasi yuqori")
        elif category_competition == "low":
            score -= 10
            details.append("Bu kategoriyada raqobat kam")

        return self._format_risk("Raqobat xavfi", "competition", score, details)

    def _assess_capacity_risk(self, features: dict[str, Any]) -> dict:
        company_experience = features.get("company_experience", 0)
        category_match = features.get("category_match", False)
        region_match = features.get("region_match", False)
        past_wins_category = features.get("past_wins_category", 0)
        active_projects = features.get("active_projects", 0)

        score = 0
        details = []

        if company_experience < 1:
            score += 45
            details.append("Kompaniya tajribasi juda kam")
        elif company_experience < 3:
            score += 25
            details.append(f"Kompaniya tajribasi cheklangan ({company_experience} yil)")
        else:
            details.append(f"{company_experience} yillik tajriba — yetarli")

        if not category_match:
            score += 25
            details.append("Kompaniya sohasi tender kategoriyasiga mos kelmaydi")
        else:
            details.append("Soha mosligi bor")

        if past_wins_category == 0:
            score += 15
            details.append("Bu sohada oldingi g'alabalar yo'q")

        if active_projects >= 5:
            score += 20
            details.append(f"Juda ko'p faol loyihalar ({active_projects} ta) — resurslar tarqalishi mumkin")
        elif active_projects >= 3:
            score += 10
            details.append(f"{active_projects} ta faol loyiha")

        return self._format_risk("Imkoniyat xavfi", "capacity", score, details)

    def _assess_documentation_risk(self, features: dict[str, Any]) -> dict:
        requires_documents = features.get("requires_documents", False)
        requires_license = features.get("requires_license", False)
        requires_guarantee = features.get("requires_guarantee", False)
        document_count = features.get("required_document_count", 0)

        score = 0
        details = []

        if document_count > 10:
            score += 40
            details.append(f"Ko'p hujjatlar talab qilinadi ({document_count} ta)")
        elif document_count > 5:
            score += 20
            details.append(f"{document_count} ta hujjat talab qilinadi")
        elif document_count > 0:
            details.append(f"{document_count} ta hujjat talab qilinadi — standart")
        else:
            details.append("Hujjatlar haqida ma'lumot yo'q")

        if requires_license:
            score += 25
            details.append("Maxsus litsenziya talab qilinadi")

        if requires_guarantee:
            score += 20
            details.append("Bank kafolati talab qilinadi")

        return self._format_risk("Hujjatlar xavfi", "documentation", score, details)

    def _assess_market_risk(self, features: dict[str, Any]) -> dict:
        organization_reliability = features.get("organization_reliability", "unknown")
        category_trend = features.get("category_trend", "stable")
        region = features.get("region", "")

        score = 0
        details = []

        if organization_reliability == "low":
            score += 50
            details.append("Tashkilotning ishonchliligi past")
        elif organization_reliability == "medium":
            score += 25
            details.append("Tashkilotning ishonchliligi o'rtacha")
        elif organization_reliability == "high":
            details.append("Tashkilot ishonchli")
        else:
            score += 15
            details.append("Tashkilot haqida ma'lumot cheklangan")

        if category_trend == "declining":
            score += 20
            details.append("Bu kategoriyada tenderlar soni kamaymoqda")
        elif category_trend == "growing":
            details.append("Bu kategoriyada tenderlar soni o'smoqda")
        else:
            details.append("Bozor barqaror")

        return self._format_risk("Bozor xavfi", "market", score, details)

    def _format_risk(self, name: str, category: str, raw_score: int, details: list[str]) -> dict:
        score = max(0, min(100, raw_score))

        if score <= 30:
            level = "past"
            label = "Past"
        elif score <= 55:
            level = "o'rta"
            label = "O'rtacha"
        else:
            level = "yuqori"
            label = "Yuqori"

        return {
            "name": name,
            "category": category,
            "score": score,
            "level": level,
            "label": label,
            "details": details,
        }

    def _build_recommendations(
        self,
        high_risks: list[dict],
        medium_risks: list[dict],
        features: dict[str, Any],
    ) -> list[str]:
        recs = []

        for risk in high_risks:
            cat = risk["category"]
            if cat == "budget":
                recs.append("Tender byudjetini bozor narxlari bilan solishtiring va real xarajatlarni hisoblang")
            elif cat == "deadline":
                recs.append("Muddat juda qisqa — barcha hujjatlarni oldindan tayyorlab qo'ying")
            elif cat == "competition":
                recs.append("Raqobat yuqori — narx va sifat bo'yicha ustunliklaringizni ta'kidlang")
            elif cat == "capacity":
                recs.append("Kompaniya imkoniyatlarini kengaytiring yoki hamkor toping")
            elif cat == "documentation":
                recs.append("Barcha zarur hujjatlarni tekshiruvdan o'tkazing")
            elif cat == "market":
                recs.append("Tashkilot haqida qo'shimcha ma'lumot to'plang")

        for risk in medium_risks:
            cat = risk["category"]
            if cat == "deadline" and "muddat" not in " ".join(recs).lower():
                recs.append("Muddatni kuzatib boring va vaqtni rejalashtiring")
            elif cat == "competition" and "raqobat" not in " ".join(recs).lower():
                recs.append("Raqobatchilarni tahlil qiling")

        if not recs:
            recs.append("Tender umumiy xavfsiz ko'rinadi. Standart tayyorgarlik yetarli.")

        return recs
