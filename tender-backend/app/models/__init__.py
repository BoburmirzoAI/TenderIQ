"""Database models — import all models here for Alembic discovery."""

from app.models.system.audit_log import AuditLog
from app.models.communication.bot_group import BotGroup
from app.models.communication.email_template import EmailTemplate
from app.models.base import Base, BaseModel
from app.models.companies.bid import Bid
from app.models.companies.company import Company
from app.models.communication.notification import Notification
from app.models.finance.payment import Payment
from app.models.finance.promo_code import PromoCode
from app.models.documents.document_check import DocumentCheck
from app.models.system.api_key import APIKey
from app.models.system.api_permission import APIPermission
from app.models.system.log_archive import LogArchive
from app.models.auth.role import Permission, Role, role_permissions, user_roles
from app.models.finance.subscription import Subscription
from app.models.tenders.tender import Tender
from app.models.tenders.tender_match import TenderMatch
from app.models.tenders.tender_application import TenderApplication
from app.models.tenders.saved_search import SavedSearch
from app.models.tenders.tender_note import TenderNote
from app.models.companies.team import Team, TeamMember
from app.models.tenders.tender_result import TenderResult
from app.models.auth.user import User

__all__ = [
    "Base",
    "BaseModel",
    "User",
    "Role",
    "Permission",
    "role_permissions",
    "user_roles",
    "Company",
    "Tender",
    "TenderResult",
    "TenderMatch",
    "Bid",
    "Subscription",
    "Payment",
    "Notification",
    "TenderApplication",
    "AuditLog",
    "TenderNote",
    "SavedSearch",
    "Team",
    "TeamMember",
    "BotGroup",
    "EmailTemplate",
    "PromoCode",
    "DocumentCheck",
    "APIKey",
    "APIPermission",
    "LogArchive",
]
