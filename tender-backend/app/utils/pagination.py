"""Pagination utilities."""

from dataclasses import dataclass
from typing import Any, Generic, TypeVar

T = TypeVar("T")


@dataclass
class PaginationResult(Generic[T]):
    """Pagination result container."""

    items: list[T]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool


def paginate(
    items: list[Any],
    total: int,
    page: int,
    per_page: int,
) -> PaginationResult:
    """Build a pagination result from items and total count."""
    total_pages = (total + per_page - 1) // per_page if per_page > 0 else 0
    return PaginationResult(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


def page_to_offset(page: int, per_page: int) -> int:
    """Convert page number to SQL offset."""
    return (max(1, page) - 1) * per_page
