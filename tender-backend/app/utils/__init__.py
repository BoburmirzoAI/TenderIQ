
def escape_like(value: str) -> str:
    """Escape special LIKE/ILIKE characters to prevent wildcard injection."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
