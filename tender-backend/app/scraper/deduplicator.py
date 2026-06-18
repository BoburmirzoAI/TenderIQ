"""Tender deduplication by external ID and fuzzy title matching."""

import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)


def is_duplicate_by_external_id(
    external_id: str, existing_ids: set[str]
) -> bool:
    """Check if external_id already exists."""
    return external_id in existing_ids


def is_duplicate_by_title(
    title: str,
    existing_titles: list[str],
    threshold: float = 0.85,
) -> bool:
    """Check if a similar title already exists using simple similarity."""
    normalized = _normalize_title(title)
    for existing in existing_titles:
        similarity = _simple_similarity(normalized, _normalize_title(existing))
        if similarity >= threshold:
            return True
    return False


def _normalize_title(title: str) -> str:
    """Normalize a title for comparison."""
    text = title.lower().strip()
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text


def _simple_similarity(a: str, b: str) -> float:
    """Calculate Jaccard similarity between two strings."""
    if not a or not b:
        return 0.0
    words_a = set(a.split())
    words_b = set(b.split())
    if not words_a or not words_b:
        return 0.0
    intersection = words_a & words_b
    union = words_a | words_b
    return len(intersection) / len(union)


def deduplicate_tenders(
    new_tenders: list[dict],
    existing_ids: set[str],
    existing_titles: Optional[list[str]] = None,
) -> list[dict]:
    """Filter out duplicate tenders from a batch."""
    unique = []
    seen_ids: set[str] = set()

    for tender in new_tenders:
        ext_id = tender.get("external_id", "")

        if ext_id in existing_ids or ext_id in seen_ids:
            continue

        if existing_titles and is_duplicate_by_title(
            tender.get("title", ""), existing_titles
        ):
            logger.debug("Duplicate title detected: %s", tender.get("title", "")[:60])
            continue

        seen_ids.add(ext_id)
        unique.append(tender)

    logger.info(
        "Deduplication: %d input → %d unique", len(new_tenders), len(unique)
    )
    return unique
