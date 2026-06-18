"""Main API router aggregating all v1 endpoint routers."""

from fastapi import APIRouter

from app.api.v1 import (
    admin,
    analytics,
    applications,
    auth,
    companies,
    competitors,
    documents,
    journal,
    ml,
    notes,
    notifications,
    saved_searches,
    payments,
    pricing,
    reports,
    subscriptions,
    teams,
    tender_map,
    tenders,
    websocket,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/v1/auth", tags=["Authentication"])
api_router.include_router(tenders.router, prefix="/v1/tenders", tags=["Tenders"])
api_router.include_router(companies.router, prefix="/v1/companies", tags=["Companies"])
api_router.include_router(analytics.router, prefix="/v1/analytics", tags=["Analytics"])
api_router.include_router(ml.router, prefix="/v1/ml", tags=["Machine Learning"])
api_router.include_router(documents.router, prefix="/v1/documents", tags=["Documents"])
api_router.include_router(subscriptions.router, prefix="/v1/subscriptions", tags=["Subscriptions"])
api_router.include_router(payments.router, prefix="/v1/payments", tags=["Payments"])
api_router.include_router(
    applications.router, prefix="/v1/applications", tags=["Applications"]
)
api_router.include_router(
    notifications.router, prefix="/v1/notifications", tags=["Notifications"]
)
api_router.include_router(reports.router, prefix="/v1/reports", tags=["Reports"])
api_router.include_router(notes.router, prefix="/v1/notes", tags=["Notes"])
api_router.include_router(competitors.router, prefix="/v1/competitors", tags=["Competitors"])
api_router.include_router(pricing.router, prefix="/v1/pricing", tags=["Smart Pricing"])
api_router.include_router(saved_searches.router, prefix="/v1/saved-searches", tags=["Saved Searches"])
api_router.include_router(teams.router, prefix="/v1/teams", tags=["Teams"])
api_router.include_router(tender_map.router, prefix="/v1/map", tags=["Tender Map"])
api_router.include_router(journal.router, prefix="/v1/journal", tags=["Win/Loss Journal"])
api_router.include_router(admin.router, prefix="/v1/admin", tags=["Admin"])
api_router.include_router(websocket.router, tags=["WebSocket"])
