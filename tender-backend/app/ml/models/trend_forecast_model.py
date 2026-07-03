"""Market trend forecasting using time series analysis with scikit-learn."""

import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone

import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures

logger = logging.getLogger(__name__)


class TrendForecastModel:
    def forecast_market(
        self,
        tenders: list[dict],
        forecast_months: int = 6,
        category: str | None = None,
        region: str | None = None,
    ) -> dict:
        if not tenders:
            return self._empty_forecast(forecast_months)

        monthly = self._aggregate_monthly(tenders)
        if len(monthly) < 3:
            return self._simple_forecast(monthly, forecast_months)

        return self._ml_forecast(monthly, forecast_months)

    def _aggregate_monthly(self, tenders: list[dict]) -> list[dict]:
        buckets: dict[str, dict] = defaultdict(
            lambda: {"count": 0, "total_amount": 0.0, "categories": defaultdict(int), "regions": defaultdict(int)}
        )

        for t in tenders:
            pub = t.get("published_at") or t.get("created_at")
            if not pub:
                continue
            if isinstance(pub, str):
                try:
                    pub = datetime.fromisoformat(pub)
                except ValueError:
                    continue
            key = pub.strftime("%Y-%m")
            buckets[key]["count"] += 1
            buckets[key]["total_amount"] += float(t.get("amount") or 0)
            cat = t.get("category", "other")
            reg = t.get("region", "other")
            buckets[key]["categories"][cat] += 1
            buckets[key]["regions"][reg] += 1

        result = []
        for month_key in sorted(buckets.keys()):
            b = buckets[month_key]
            avg = b["total_amount"] / b["count"] if b["count"] > 0 else 0
            top_cat = max(b["categories"], key=b["categories"].get) if b["categories"] else "other"
            top_reg = max(b["regions"], key=b["regions"].get) if b["regions"] else "other"
            result.append({
                "month": month_key,
                "count": b["count"],
                "total_amount": round(b["total_amount"], 2),
                "avg_amount": round(avg, 2),
                "top_category": top_cat,
                "top_region": top_reg,
            })
        return result

    def _ml_forecast(self, monthly: list[dict], forecast_months: int) -> dict:
        counts = np.array([m["count"] for m in monthly], dtype=float)
        amounts = np.array([m["avg_amount"] for m in monthly], dtype=float)
        n = len(counts)
        X = np.arange(n).reshape(-1, 1)

        degree = min(2, max(1, n // 4))
        poly = PolynomialFeatures(degree=degree)
        X_poly = poly.fit_transform(X)

        count_model = LinearRegression()
        count_model.fit(X_poly, counts)

        amount_model = LinearRegression()
        amount_model.fit(X_poly, amounts)

        count_pred = count_model.predict(X_poly)
        amount_pred = amount_model.predict(X_poly)

        ss_res_count = np.sum((counts - count_pred) ** 2)
        ss_tot_count = np.sum((counts - np.mean(counts)) ** 2)
        r2_count = 1 - (ss_res_count / ss_tot_count) if ss_tot_count > 0 else 0

        ss_res_amount = np.sum((amounts - amount_pred) ** 2)
        ss_tot_amount = np.sum((amounts - np.mean(amounts)) ** 2)
        r2_amount = 1 - (ss_res_amount / ss_tot_amount) if ss_tot_amount > 0 else 0

        last_month = datetime.strptime(monthly[-1]["month"], "%Y-%m")
        future_X = np.arange(n, n + forecast_months).reshape(-1, 1)
        future_X_poly = poly.transform(future_X)

        future_counts = count_model.predict(future_X_poly)
        future_amounts = amount_model.predict(future_X_poly)

        forecast_data = []
        for i in range(forecast_months):
            future_date = last_month + timedelta(days=30 * (i + 1))
            month_str = future_date.strftime("%Y-%m")
            pred_count = max(0, round(future_counts[i]))
            pred_amount = max(0, round(future_amounts[i], 2))
            forecast_data.append({
                "month": month_str,
                "predicted_count": pred_count,
                "predicted_avg_amount": pred_amount,
                "predicted_total_amount": round(pred_count * pred_amount, 2),
                "is_forecast": True,
            })

        history_data = []
        for i, m in enumerate(monthly):
            history_data.append({
                "month": m["month"],
                "count": m["count"],
                "avg_amount": m["avg_amount"],
                "total_amount": m["total_amount"],
                "trend_count": max(0, round(count_pred[i])),
                "trend_amount": max(0, round(amount_pred[i], 2)),
                "is_forecast": False,
            })

        count_trend = self._calc_trend(counts)
        amount_trend = self._calc_trend(amounts)

        avg_recent = float(np.mean(counts[-3:])) if n >= 3 else float(np.mean(counts))
        avg_older = float(np.mean(counts[:-3])) if n > 3 else avg_recent
        growth_rate = ((avg_recent - avg_older) / avg_older * 100) if avg_older > 0 else 0

        category_trends = self._calc_category_trends(
            [t for m in monthly for t in [m]], field="top_category"
        )

        confidence = min(95, max(30, int(
            30 + min(r2_count, 1) * 25 + min(r2_amount, 1) * 25 + min(n / 12, 1) * 15
        )))

        return {
            "history": history_data,
            "forecast": forecast_data,
            "summary": {
                "count_trend": count_trend,
                "amount_trend": amount_trend,
                "growth_rate": round(growth_rate, 1),
                "avg_monthly_count": round(float(np.mean(counts)), 1),
                "avg_monthly_amount": round(float(np.mean(amounts)), 2),
                "total_months_analyzed": n,
                "forecast_months": forecast_months,
                "confidence": confidence,
                "r2_count": round(max(0, r2_count), 3),
                "r2_amount": round(max(0, r2_amount), 3),
            },
            "insights": self._generate_insights(
                count_trend, amount_trend, growth_rate, counts, amounts, forecast_data
            ),
        }

    def _simple_forecast(self, monthly: list[dict], forecast_months: int) -> dict:
        if not monthly:
            return self._empty_forecast(forecast_months)

        avg_count = sum(m["count"] for m in monthly) / len(monthly)
        avg_amount = sum(m["avg_amount"] for m in monthly) / len(monthly)

        last_month = datetime.strptime(monthly[-1]["month"], "%Y-%m")
        forecast_data = []
        for i in range(forecast_months):
            future_date = last_month + timedelta(days=30 * (i + 1))
            forecast_data.append({
                "month": future_date.strftime("%Y-%m"),
                "predicted_count": round(avg_count),
                "predicted_avg_amount": round(avg_amount, 2),
                "predicted_total_amount": round(avg_count * avg_amount, 2),
                "is_forecast": True,
            })

        history_data = [{
            "month": m["month"],
            "count": m["count"],
            "avg_amount": m["avg_amount"],
            "total_amount": m["total_amount"],
            "trend_count": m["count"],
            "trend_amount": m["avg_amount"],
            "is_forecast": False,
        } for m in monthly]

        return {
            "history": history_data,
            "forecast": forecast_data,
            "summary": {
                "count_trend": "barqaror",
                "amount_trend": "barqaror",
                "growth_rate": 0,
                "avg_monthly_count": round(avg_count, 1),
                "avg_monthly_amount": round(avg_amount, 2),
                "total_months_analyzed": len(monthly),
                "forecast_months": forecast_months,
                "confidence": 30,
                "r2_count": 0,
                "r2_amount": 0,
            },
            "insights": [
                "Ma'lumot kam — prognoz o'rtacha qiymatlarga asoslangan.",
                "Ko'proq oy davomida ma'lumot yig'ilgandan keyin aniqroq prognoz beriladi.",
            ],
        }

    def _empty_forecast(self, forecast_months: int) -> dict:
        now = datetime.now(timezone.utc)
        forecast_data = []
        for i in range(forecast_months):
            future_date = now + timedelta(days=30 * (i + 1))
            forecast_data.append({
                "month": future_date.strftime("%Y-%m"),
                "predicted_count": 0,
                "predicted_avg_amount": 0,
                "predicted_total_amount": 0,
                "is_forecast": True,
            })
        return {
            "history": [],
            "forecast": forecast_data,
            "summary": {
                "count_trend": "noma'lum",
                "amount_trend": "noma'lum",
                "growth_rate": 0,
                "avg_monthly_count": 0,
                "avg_monthly_amount": 0,
                "total_months_analyzed": 0,
                "forecast_months": forecast_months,
                "confidence": 0,
                "r2_count": 0,
                "r2_amount": 0,
            },
            "insights": ["Prognoz uchun tarixiy ma'lumotlar mavjud emas."],
        }

    def _calc_trend(self, values: np.ndarray) -> str:
        if len(values) < 2:
            return "barqaror"
        X = np.arange(len(values)).reshape(-1, 1)
        model = LinearRegression()
        model.fit(X, values)
        slope = model.coef_[0]
        mean_val = np.mean(values)
        if mean_val == 0:
            return "barqaror"
        relative_slope = slope / mean_val
        if relative_slope > 0.05:
            return "o'sish"
        elif relative_slope < -0.05:
            return "pasayish"
        return "barqaror"

    def _calc_category_trends(self, data: list[dict], field: str) -> dict[str, int]:
        counts: dict[str, int] = defaultdict(int)
        for item in data:
            val = item.get(field, "other")
            counts[val] += 1
        return dict(sorted(counts.items(), key=lambda x: -x[1]))

    def _generate_insights(
        self,
        count_trend: str,
        amount_trend: str,
        growth_rate: float,
        counts: np.ndarray,
        amounts: np.ndarray,
        forecast: list[dict],
    ) -> list[str]:
        insights = []

        if count_trend == "o'sish":
            insights.append(
                f"Tender soni o'sish trendida — oylik o'rtacha {growth_rate:+.1f}% o'sish."
            )
        elif count_trend == "pasayish":
            insights.append(
                f"Tender soni pasayish trendida — oylik o'rtacha {growth_rate:+.1f}% kamayish."
            )
        else:
            insights.append("Tender soni barqaror holatda.")

        if amount_trend == "o'sish":
            insights.append("Tender summalari o'sib bormoqda — bozorda faollik oshmoqda.")
        elif amount_trend == "pasayish":
            insights.append("Tender summalari kamaymoqda — byudjet optimizatsiyasi kuzatilmoqda.")

        if len(counts) >= 6:
            recent_std = float(np.std(counts[-6:]))
            overall_std = float(np.std(counts))
            if recent_std > overall_std * 1.5:
                insights.append(
                    "So'nggi oylarda beqarorlik kuzatilmoqda — bozor tebranishi yuqori."
                )

        if forecast:
            max_month = max(forecast, key=lambda x: x["predicted_count"])
            insights.append(
                f"Eng faol oy: {max_month['month']} — taxminan {max_month['predicted_count']} ta tender kutilmoqda."
            )

        return insights
