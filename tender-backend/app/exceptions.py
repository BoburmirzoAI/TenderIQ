"""Custom exception classes for TenderIQ."""


class TenderIQException(Exception):
    """Base exception for all TenderIQ errors."""

    def __init__(self, detail: str, status_code: int = 400) -> None:
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class NotFoundException(TenderIQException):
    """Resource not found."""

    def __init__(self, resource: str = "Resource", identifier: str = "") -> None:
        detail = f"{resource} not found"
        if identifier:
            detail = f"{resource} '{identifier}' not found"
        super().__init__(detail=detail, status_code=404)


class UnauthorizedException(TenderIQException):
    """Authentication required or failed."""

    def __init__(self, detail: str = "Authentication required") -> None:
        super().__init__(detail=detail, status_code=401)


class ForbiddenException(TenderIQException):
    """Insufficient permissions."""

    def __init__(self, detail: str = "Insufficient permissions") -> None:
        super().__init__(detail=detail, status_code=403)


class ConflictException(TenderIQException):
    """Resource already exists or conflicting state."""

    def __init__(self, detail: str = "Resource already exists") -> None:
        super().__init__(detail=detail, status_code=409)


class ValidationException(TenderIQException):
    """Input validation failed."""

    def __init__(self, detail: str = "Validation error") -> None:
        super().__init__(detail=detail, status_code=422)


class RateLimitException(TenderIQException):
    """Rate limit exceeded."""

    def __init__(self, detail: str = "Rate limit exceeded. Upgrade your plan for higher limits.") -> None:
        super().__init__(detail=detail, status_code=429)


class PaymentException(TenderIQException):
    """Payment processing error."""

    def __init__(self, detail: str = "Payment processing failed") -> None:
        super().__init__(detail=detail, status_code=402)


class ExternalServiceException(TenderIQException):
    """External service (Claude AI, Telegram, etc.) error."""

    def __init__(self, service: str, detail: str = "Service unavailable") -> None:
        super().__init__(detail=f"{service}: {detail}", status_code=502)


class PlanLimitException(TenderIQException):
    """Subscription plan limit reached."""

    def __init__(self, feature: str = "this feature") -> None:
        super().__init__(
            detail=f"Your plan does not include {feature}. Please upgrade.",
            status_code=403,
        )


class ScraperException(TenderIQException):
    """Scraper encountered an error."""

    def __init__(self, source: str, detail: str = "Scraping failed") -> None:
        super().__init__(detail=f"Scraper [{source}]: {detail}", status_code=500)


class MLModelException(TenderIQException):
    """ML model error."""

    def __init__(self, detail: str = "Model prediction failed") -> None:
        super().__init__(detail=detail, status_code=500)
