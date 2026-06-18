"""Telegram message formatting utilities."""

from typing import Any, Optional

from app.utils.formatters import format_date, format_money


def format_tender_message(tender: dict[str, Any]) -> str:
    """Format a tender for Telegram display."""
    title = tender.get("title", "N/A")[:200]
    org = tender.get("organization", "N/A")
    amount = tender.get("amount")
    category = tender.get("category", "")
    region = tender.get("region", "")
    deadline = tender.get("deadline")
    score = tender.get("score")

    lines = [f"<b>{title}</b>"]
    lines.append(f"🏢 {org}")

    if amount:
        lines.append(f"💰 {format_money(amount)}")
    if category:
        lines.append(f"📂 {category}")
    if region:
        lines.append(f"📍 {region}")
    if deadline:
        lines.append(f"📅 Muddat: {format_date(deadline)}")
    if score is not None:
        lines.append(f"🎯 Moslik: {score:.0f}%")

    return "\n".join(lines)


def format_competitor_message(competitor: dict[str, Any]) -> str:
    """Format a competitor for Telegram display."""
    name = competitor.get("name", "N/A")
    wins = competitor.get("total_wins", 0)
    avg = competitor.get("avg_winning_amount", 0)

    return (
        f"<b>{name}</b>\n"
        f"G'olibliklar: {wins}\n"
        f"O'rtacha summa: {format_money(avg)}"
    )
