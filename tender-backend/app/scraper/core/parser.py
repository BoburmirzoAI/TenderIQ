"""HTML and JSON parser for extracting structured tender data."""

import json
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)


def parse_tender_html(content: str, source: str = "uzex") -> list[dict[str, Any]]:
    """Parse HTML or JSON content into a list of raw tender dicts."""
    try:
        data = json.loads(content)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return data.get("data", data.get("results", data.get("items", [])))
    except json.JSONDecodeError:
        pass

    return _parse_html_table(content, source)


def _parse_html_table(html: str, source: str) -> list[dict[str, Any]]:
    """Extract tender data from HTML table structure."""
    tenders = []

    row_pattern = re.compile(r"<tr[^>]*>(.*?)</tr>", re.DOTALL)
    cell_pattern = re.compile(r"<td[^>]*>(.*?)</td>", re.DOTALL)
    link_pattern = re.compile(r'href="([^"]*)"')

    rows = row_pattern.findall(html)

    for row in rows[1:]:
        cells = cell_pattern.findall(row)
        if len(cells) < 3:
            continue

        cleaned_cells = [_strip_html(c).strip() for c in cells]
        links = link_pattern.findall(row)

        tender: dict[str, Any] = {
            "id": _extract_id(links[0] if links else "", source),
            "title": cleaned_cells[0] if len(cleaned_cells) > 0 else "",
            "organization": cleaned_cells[1] if len(cleaned_cells) > 1 else "",
            "amount": cleaned_cells[2] if len(cleaned_cells) > 2 else "",
            "deadline": cleaned_cells[3] if len(cleaned_cells) > 3 else "",
            "category": cleaned_cells[4] if len(cleaned_cells) > 4 else "",
            "region": cleaned_cells[5] if len(cleaned_cells) > 5 else "",
            "url": links[0] if links else "",
        }
        tenders.append(tender)

    return tenders


def _strip_html(text: str) -> str:
    """Remove HTML tags from text."""
    return re.sub(r"<[^>]+>", "", text)


def _extract_id(url: str, source: str) -> str:
    """Extract tender ID from URL."""
    numbers = re.findall(r"\d+", url)
    if numbers:
        return numbers[-1]
    return ""
