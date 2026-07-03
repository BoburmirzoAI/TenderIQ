"""Main API router aggregating all v1 endpoint routers."""

from fastapi import APIRouter

from app.api.v1.auth.auth import router as auth_router
from app.api.v1.tenders.tenders import router as tenders_router
from app.api.v1.tenders.tender_map import router as tender_map_router
from app.api.v1.tenders.notes import router as notes_router
from app.api.v1.tenders.saved_searches import router as saved_searches_router
from app.api.v1.tenders.purchase_plans import router as purchase_plans_router
from app.api.v1.tenders.contracts import router as contracts_router
from app.api.v1.companies.companies import router as companies_router
from app.api.v1.companies.teams import router as teams_router
from app.api.v1.companies.competitors import router as competitors_router
from app.api.v1.companies.ratings import router as ratings_router
from app.api.v1.finance.payments import router as payments_router
from app.api.v1.finance.subscriptions import router as subscriptions_router
from app.api.v1.finance.pricing import router as pricing_router
from app.api.v1.communication.notifications import router as notifications_router
from app.api.v1.communication.support import router as support_router
from app.api.v1.communication.faq import router as faq_router
from app.api.v1.communication.news import router as news_router
from app.api.v1.communication.knowledge_base import router as kb_router
from app.api.v1.communication.contact import router as contact_router
from app.api.v1.documents.documents import router as documents_router
from app.api.v1.documents.comments import router as doc_comments_router
from app.api.v1.ai.ml import router as ml_router
from app.api.v1.ai.analytics import router as analytics_router
from app.api.v1.ai.interests import router as interests_router
from app.api.v1.ai.recommendations import router as recommendations_router
from app.api.v1.applications.applications import router as applications_router
from app.api.v1.applications.journal import router as journal_router
from app.api.v1.reports.reports import router as reports_router
from app.api.v1.realtime.websocket import router as websocket_router
from app.api.v1.admin.router import router as admin_router
from app.api.v1.admin.system.container_logs import router as container_logs_router

api_router = APIRouter()

# Auth
api_router.include_router(auth_router, prefix="/v1/auth", tags=["Authentication"])

# Tenders
api_router.include_router(tenders_router, prefix="/v1/tenders", tags=["Tenders"])
api_router.include_router(tender_map_router, prefix="/v1/map", tags=["Tender Map"])
api_router.include_router(notes_router, prefix="/v1/notes", tags=["Notes"])
api_router.include_router(saved_searches_router, prefix="/v1/saved-searches", tags=["Saved Searches"])
api_router.include_router(purchase_plans_router, prefix="/v1/purchase-plans", tags=["Purchase Plans"])
api_router.include_router(contracts_router, prefix="/v1/contracts", tags=["Contracts"])

# Companies
api_router.include_router(companies_router, prefix="/v1/companies", tags=["Companies"])
api_router.include_router(teams_router, prefix="/v1/teams", tags=["Teams"])
api_router.include_router(competitors_router, prefix="/v1/competitors", tags=["Competitors"])
api_router.include_router(ratings_router, prefix="/v1/ratings", tags=["Company Ratings"])

# Finance
api_router.include_router(payments_router, prefix="/v1/payments", tags=["Payments"])
api_router.include_router(subscriptions_router, prefix="/v1/subscriptions", tags=["Subscriptions"])
api_router.include_router(pricing_router, prefix="/v1/pricing", tags=["Smart Pricing"])

# Communication
api_router.include_router(notifications_router, prefix="/v1/notifications", tags=["Notifications"])
api_router.include_router(support_router, prefix="/v1/support", tags=["Support Tickets"])
api_router.include_router(faq_router, prefix="/v1/faq", tags=["FAQ"])
api_router.include_router(news_router, prefix="/v1/news", tags=["News"])
api_router.include_router(kb_router, prefix="/v1/knowledge-base", tags=["Knowledge Base"])
api_router.include_router(contact_router, prefix="/v1/contact", tags=["Contact"])

# Documents
api_router.include_router(documents_router, prefix="/v1/documents", tags=["Documents"])
api_router.include_router(doc_comments_router, prefix="/v1/doc-comments", tags=["Document Comments"])

# AI / ML
api_router.include_router(ml_router, prefix="/v1/ml", tags=["Machine Learning"])
api_router.include_router(analytics_router, prefix="/v1/analytics", tags=["Analytics"])
api_router.include_router(interests_router, prefix="/v1/interests", tags=["User Interests"])
api_router.include_router(recommendations_router, prefix="/v1/recommendations", tags=["AI Recommendations"])

# Applications
api_router.include_router(applications_router, prefix="/v1/applications", tags=["Applications"])
api_router.include_router(journal_router, prefix="/v1/journal", tags=["Win/Loss Journal"])

# Reports
api_router.include_router(reports_router, prefix="/v1/reports", tags=["Reports"])

# Realtime
api_router.include_router(websocket_router, tags=["WebSocket"])

# Admin
api_router.include_router(admin_router, prefix="/v1/admin", tags=["Admin"])

# Container Logs (permission-based, not admin-only)
api_router.include_router(container_logs_router, prefix="/v1/containers", tags=["Container Logs"])
