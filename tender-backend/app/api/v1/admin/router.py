"""Admin panel — combined router organized by domain."""

from fastapi import APIRouter, Depends
from app.dependencies import require_admin

from app.api.v1.admin.analytics.dashboard import router as dashboard_router
from app.api.v1.admin.analytics.analytics import router as analytics_router

from app.api.v1.admin.users.users import router as users_router
from app.api.v1.admin.users.roles import router as roles_router
from app.api.v1.admin.users.audit_log import router as audit_log_router

from app.api.v1.admin.tenders.tenders import router as tenders_router
from app.api.v1.admin.tenders.tender_matches import router as tender_matches_router
from app.api.v1.admin.tenders.pipeline import router as pipeline_router
from app.api.v1.admin.tenders.win_loss import router as win_loss_router
from app.api.v1.admin.tenders.saved_searches import router as saved_searches_router
from app.api.v1.admin.tenders.competitors import router as competitors_router

from app.api.v1.admin.companies.companies import router as companies_router
from app.api.v1.admin.companies.teams import router as teams_router

from app.api.v1.admin.finance.financials import router as financials_router
from app.api.v1.admin.finance.promo_codes import router as promo_codes_router

from app.api.v1.admin.communication.notifications import router as notifications_router
from app.api.v1.admin.communication.email_templates import router as email_templates_router

from app.api.v1.admin.documents.documents import router as documents_router

from app.api.v1.admin.ai.ai_models import router as ai_models_router

from app.api.v1.admin.system.settings import router as settings_router
from app.api.v1.admin.system.integrations import router as integrations_router
from app.api.v1.admin.system.infrastructure import router as infrastructure_router
from app.api.v1.admin.system.api_keys import router as api_keys_router
from app.api.v1.admin.system.api_endpoints import router as api_endpoints_router
from app.api.v1.admin.system.health import router as health_router

router = APIRouter(tags=["Admin"], dependencies=[Depends(require_admin)])

# Analytics
router.include_router(dashboard_router, prefix="/dashboard")
router.include_router(analytics_router, prefix="/analytics")

# Users
router.include_router(users_router, prefix="/users")
router.include_router(roles_router, prefix="/roles")
router.include_router(audit_log_router, prefix="/audit-log")

# Tenders
router.include_router(tenders_router, prefix="/tenders")
router.include_router(tender_matches_router, prefix="/tender-matches")
router.include_router(pipeline_router, prefix="/pipeline")
router.include_router(win_loss_router, prefix="/win-loss")
router.include_router(saved_searches_router, prefix="/saved-searches")
router.include_router(competitors_router, prefix="/competitors")

# Companies
router.include_router(companies_router, prefix="/companies")
router.include_router(teams_router, prefix="/teams")

# Finance
router.include_router(financials_router, prefix="/financials")
router.include_router(promo_codes_router, prefix="/promo-codes")

# Communication
router.include_router(notifications_router, prefix="/notifications")
router.include_router(email_templates_router, prefix="/email-templates")

# Documents
router.include_router(documents_router, prefix="/documents")

# AI
router.include_router(ai_models_router, prefix="/ai-models")

# System
router.include_router(settings_router, prefix="/settings")
router.include_router(integrations_router, prefix="/integrations")
router.include_router(infrastructure_router, prefix="/infrastructure")
router.include_router(api_keys_router, prefix="/api-keys")
router.include_router(api_endpoints_router, prefix="/api-endpoints")
router.include_router(health_router, prefix="/health")
