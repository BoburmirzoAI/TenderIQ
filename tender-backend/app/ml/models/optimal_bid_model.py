"""Optimal bid recommendation using win probability simulation."""

import logging
from typing import Any

import numpy as np

from app.ml.models.win_probability_model import WinProbabilityModel

logger = logging.getLogger(__name__)


class OptimalBidModel:
    """Recommends optimal bid amount by simulating win probability across price points."""

    def predict(
        self,
        win_model: WinProbabilityModel,
        base_features: dict[str, Any],
        tender_amount: float,
    ) -> dict[str, Any]:
        if tender_amount <= 0:
            return self._empty_result()

        ratios = np.arange(0.70, 1.05, 0.01)
        simulations: list[dict] = []

        for ratio in ratios:
            features = {**base_features, "bid_ratio": float(ratio)}
            result = win_model.predict(features)
            bid = round(tender_amount * ratio, 2)
            win_prob = result["win_probability"]
            profit = tender_amount - bid
            profit_margin = (profit / tender_amount) * 100
            expected_value = (win_prob / 100) * profit

            simulations.append({
                "bid_amount": bid,
                "bid_ratio": round(float(ratio), 2),
                "win_probability": win_prob,
                "profit": round(profit, 2),
                "profit_margin": round(profit_margin, 1),
                "expected_value": round(expected_value, 2),
            })

        best_ev = max(simulations, key=lambda x: x["expected_value"])
        best_win = max(simulations, key=lambda x: x["win_probability"])
        best_profit = max(
            [s for s in simulations if s["win_probability"] >= 40],
            key=lambda x: x["profit"],
            default=best_ev,
        )

        strategies = [
            {
                "name": "Muvozanatli",
                "description": "Foyda va g'alaba ehtimoli o'rtasidagi eng yaxshi balans",
                "bid_amount": best_ev["bid_amount"],
                "win_probability": best_ev["win_probability"],
                "profit_margin": best_ev["profit_margin"],
                "expected_value": best_ev["expected_value"],
                "recommended": True,
            },
            {
                "name": "Agressiv",
                "description": "Eng yuqori g'alaba ehtimoli — past foyda",
                "bid_amount": best_win["bid_amount"],
                "win_probability": best_win["win_probability"],
                "profit_margin": best_win["profit_margin"],
                "expected_value": best_win["expected_value"],
                "recommended": False,
            },
            {
                "name": "Konservativ",
                "description": "Yuqori foyda — g'alaba ehtimoli kamroq",
                "bid_amount": best_profit["bid_amount"],
                "win_probability": best_profit["win_probability"],
                "profit_margin": best_profit["profit_margin"],
                "expected_value": best_profit["expected_value"],
                "recommended": False,
            },
        ]

        chart_data = [
            {
                "bid_ratio": s["bid_ratio"],
                "bid_amount": s["bid_amount"],
                "win_probability": s["win_probability"],
                "expected_value": s["expected_value"],
                "profit_margin": s["profit_margin"],
            }
            for s in simulations[::2]
        ]

        return {
            "tender_amount": tender_amount,
            "optimal_bid": best_ev["bid_amount"],
            "optimal_ratio": best_ev["bid_ratio"],
            "win_probability": best_ev["win_probability"],
            "expected_value": best_ev["expected_value"],
            "profit_margin": best_ev["profit_margin"],
            "strategies": strategies,
            "chart_data": chart_data,
            "recommendation": self._build_recommendation(best_ev, tender_amount),
        }

    def _build_recommendation(self, best: dict, tender_amount: float) -> str:
        bid = best["bid_amount"]
        wp = best["win_probability"]
        pm = best["profit_margin"]

        if wp >= 70 and pm >= 10:
            return (
                f"Tavsiya etilgan narx: {bid:,.0f} UZS. "
                f"G'alaba ehtimoli yuqori ({wp}%) va foyda darajasi yaxshi ({pm}%). "
                f"Bu narxda ariza berishingiz mumkin."
            )
        elif wp >= 50:
            return (
                f"Tavsiya etilgan narx: {bid:,.0f} UZS. "
                f"G'alaba ehtimoli o'rtacha ({wp}%). "
                f"Raqobatbardosh narx, lekin yutish kafolatlanmagan."
            )
        else:
            return (
                f"Tavsiya etilgan narx: {bid:,.0f} UZS. "
                f"G'alaba ehtimoli past ({wp}%). "
                f"Strategiyani qayta ko'rib chiqishni tavsiya qilamiz."
            )

    def _empty_result(self) -> dict[str, Any]:
        return {
            "tender_amount": 0,
            "optimal_bid": 0,
            "optimal_ratio": 0,
            "win_probability": 0,
            "expected_value": 0,
            "profit_margin": 0,
            "strategies": [],
            "chart_data": [],
            "recommendation": "Tender summasi kiritilmagan.",
        }
