"""Admin test fixtures — shared across all admin test modules."""

import pytest
from app.models.tenders.tender import Tender
from app.models.auth.user import User
from app.models.companies.company import Company
from app.models.finance.subscription import Subscription
from app.models.system.audit_log import AuditLog
from app.models.communication.email_template import EmailTemplate
from app.models.finance.promo_code import PromoCode
from app.models.companies.team import Team, TeamMember
from app.models.tenders.saved_search import SavedSearch
from app.models.tenders.tender_result import TenderResult
from app.models.tenders.tender_match import TenderMatch
from app.models.tenders.tender_application import TenderApplication
from app.models.documents.document_check import DocumentCheck
from app.models.system.api_key import APIKey
from datetime import datetime, timedelta, timezone
import json


@pytest.fixture
async def admin_user(db_session):
    user = User(
        email="superadmin@test.com",
        hashed_password="hashed",
        full_name="Super Admin",
        is_active=True,
        is_admin=True,
        is_superadmin=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def regular_user(db_session):
    user = User(
        email="user@test.com",
        hashed_password="hashed",
        full_name="Regular User",
        is_active=True,
        is_admin=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user):
    from app.utils.security import create_access_token
    return {"Authorization": f"Bearer {create_access_token({'sub': str(admin_user.id)})}"}


@pytest.fixture
def user_token(regular_user):
    from app.utils.security import create_access_token
    return {"Authorization": f"Bearer {create_access_token({'sub': str(regular_user.id)})}"}


@pytest.fixture
async def sample_tenders(db_session):
    now = datetime.now(timezone.utc)
    tenders = []
    for i in range(5):
        t = Tender(
            external_id=f"EXT-{i:03d}",
            source=["uzex", "mc", "mygov"][i % 3],
            title=f"Test Tender {i}",
            organization=f"Org {i}",
            category=["IT", "Qurilish", "Tibbiyot"][i % 3],
            region=["Toshkent", "Samarqand", "Buxoro"][i % 3],
            status="active",
            amount=(i + 1) * 100_000_000,
            currency="UZS",
            deadline=now + timedelta(days=10 + i),
        )
        db_session.add(t)
        tenders.append(t)
    await db_session.commit()
    for t in tenders:
        await db_session.refresh(t)
    return tenders


@pytest.fixture
async def sample_company(db_session, regular_user):
    c = Company(
        user_id=regular_user.id,
        name="Sample Company LLC",
        stir="123456789",
    )
    db_session.add(c)
    await db_session.commit()
    await db_session.refresh(c)
    return c


@pytest.fixture
async def sample_audit_logs(db_session, admin_user):
    logs = []
    for i, action in enumerate(["login", "tender_viewed", "user_updated", "settings_changed", "export_created"]):
        log = AuditLog(
            user_id=admin_user.id,
            action=action,
            resource_type=["auth", "tender", "user", "settings", "report"][i],
        )
        db_session.add(log)
        logs.append(log)
    await db_session.commit()
    return logs


@pytest.fixture
async def sample_email_templates(db_session):
    templates = []
    for slug, subject in [
        ("welcome", "Xush kelibsiz!"),
        ("password_reset", "Parolni tiklash"),
        ("new_tender_match", "Yangi tender topildi"),
    ]:
        t = EmailTemplate(
            slug=slug,
            name=slug.replace("_", " ").title(),
            subject=subject,
            body=f"<p>Hello {{{{full_name}}}}</p>",
            variables=json.dumps(["full_name"]),
        )
        db_session.add(t)
        templates.append(t)
    await db_session.commit()
    for t in templates:
        await db_session.refresh(t)
    return templates


@pytest.fixture
async def sample_promo_codes(db_session):
    codes = []
    for code, dtype, dval in [("SAVE10", "percent", 10.0), ("FLAT50K", "fixed", 50000.0)]:
        pc = PromoCode(
            code=code,
            discount_type=dtype,
            discount_value=dval,
            plan="all",
            max_uses=100,
            used_count=0,
            is_active=True,
        )
        db_session.add(pc)
        codes.append(pc)
    await db_session.commit()
    for c in codes:
        await db_session.refresh(c)
    return codes


@pytest.fixture
async def sample_team(db_session, regular_user):
    company = Company(
        user_id=regular_user.id,
        name="Test Team Company",
        stir="111222333",
    )
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)
    team = Team(name="Alpha Team", company_id=company.id, owner_id=regular_user.id)
    db_session.add(team)
    await db_session.commit()
    await db_session.refresh(team)
    member = TeamMember(team_id=team.id, user_id=regular_user.id, role="owner")
    db_session.add(member)
    await db_session.commit()
    return team


@pytest.fixture
async def sample_saved_searches(db_session, regular_user):
    searches = []
    for i in range(3):
        s = SavedSearch(
            user_id=regular_user.id,
            name=f"Search {i}",
            filters=json.dumps({"category": "IT", "region": "Toshkent"}),
            notify=True,
        )
        db_session.add(s)
        searches.append(s)
    await db_session.commit()
    for s in searches:
        await db_session.refresh(s)
    return searches


@pytest.fixture
async def sample_tender_results(db_session, sample_tenders):
    results = []
    for t in sample_tenders[:3]:
        r = TenderResult(
            tender_id=t.id,
            winner_name=f"Winner Corp {t.id}",
            winner_stir="987654321",
            winning_amount=t.amount * 0.9 if t.amount else None,
        )
        db_session.add(r)
        results.append(r)
    await db_session.commit()
    for r in results:
        await db_session.refresh(r)
    return results


@pytest.fixture
async def sample_tender_matches(db_session, sample_company, sample_tenders):
    matches = []
    for t in sample_tenders[:3]:
        m = TenderMatch(
            company_id=sample_company.id,
            tender_id=t.id,
            score=0.85 + (t.id * 0.01),
            is_notified=True,
            is_saved=False,
        )
        db_session.add(m)
        matches.append(m)
    await db_session.commit()
    for m in matches:
        await db_session.refresh(m)
    return matches


@pytest.fixture
async def sample_pipeline(db_session, regular_user, sample_tenders):
    apps = []
    stages = ["discovered", "analyzing", "preparing", "submitted", "won"]
    for i, t in enumerate(sample_tenders):
        a = TenderApplication(
            user_id=regular_user.id,
            tender_id=t.id,
            stage=stages[i % len(stages)],
            bid_amount=t.amount * 0.88 if t.amount else None,
            notes=f"Note {i}",
        )
        db_session.add(a)
        apps.append(a)
    await db_session.commit()
    for a in apps:
        await db_session.refresh(a)
    return apps


@pytest.fixture
async def sample_document_check(db_session, regular_user):
    doc = DocumentCheck(
        user_id=regular_user.id,
        filename="tender_doc.pdf",
        file_type="pdf",
        file_size_kb=512,
        tender_name="IT uskunalar tenderi",
        compliance_score=85.0,
        issues_count=2,
        checklist=json.dumps([{"name": "Imzo mavjud", "status": "pass"}]),
        missing_items=json.dumps(["Litsenziya nusxasi"]),
        status="checked",
    )
    db_session.add(doc)
    await db_session.commit()
    await db_session.refresh(doc)
    return doc


@pytest.fixture
async def sample_api_key(db_session, regular_user):
    full_key, prefix, key_hash = APIKey.generate()
    key = APIKey(
        user_id=regular_user.id,
        name="Test API Key",
        key_hash=key_hash,
        key_prefix=prefix,
        scopes=json.dumps(["tenders:read"]),
        is_active=True,
    )
    db_session.add(key)
    await db_session.commit()
    await db_session.refresh(key)
    return key, full_key
