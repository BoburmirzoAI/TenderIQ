# TenderIQ — Professional Backend Arxitekturasi

> **Tamoyil:** Har bir fayl faqat bitta ish qiladi. Har bir papka faqat bitta mas'uliyatga ega.
> Yangi dasturchi loyihaga kirsa — 10 daqiqada qayerda nima borligini tushunishi kerak.

---

## LOYIHA TUZILMASI (To'liq)

```
tenderiq/
│
├── 📁 app/                          # Barcha backend kodi
│   │
│   ├── 📄 main.py                   # FastAPI app — faqat router ulash
│   ├── 📄 config.py                 # .env sozlamalar — faqat o'zgaruvchilar
│   ├── 📄 database.py               # DB ulanish — faqat engine va session
│   ├── 📄 dependencies.py           # Umumiy Depends() funksiyalar
│   ├── 📄 exceptions.py             # Custom xato klasslari
│   ├── 📄 constants.py              # O'zgarmas qiymatlar (enum, sabitlar)
│   │
│   ├── 📁 api/                      # HTTP qatlami — faqat so'rov/javob
│   │   ├── 📄 __init__.py
│   │   ├── 📄 router.py             # Barcha routerlarni birlashtiradi
│   │   └── 📁 v1/                   # API versiya 1
│   │       ├── 📄 __init__.py
│   │       ├── 📄 auth.py           # /auth/* endpointlar
│   │       ├── 📄 tenders.py        # /tenders/* endpointlar
│   │       ├── 📄 companies.py      # /companies/* endpointlar
│   │       ├── 📄 analytics.py      # /analytics/* endpointlar
│   │       ├── 📄 ml.py             # /ml/* endpointlar
│   │       ├── 📄 documents.py      # /documents/* endpointlar
│   │       ├── 📄 subscriptions.py  # /subscriptions/* endpointlar
│   │       ├── 📄 payments.py       # /payments/* + webhook endpointlar
│   │       ├── 📄 admin.py          # /admin/* endpointlar (himoyalangan)
│   │       └── 📄 websocket.py      # /ws/* real-time endpointlar
│   │
│   ├── 📁 models/                   # SQLAlchemy DB modellari (jadvallar)
│   │   ├── 📄 __init__.py           # Barcha modellarni import qiladi
│   │   ├── 📄 base.py               # Base class (id, created_at, updated_at)
│   │   ├── 📄 user.py               # users jadvali
│   │   ├── 📄 company.py            # companies jadvali
│   │   ├── 📄 tender.py             # tenders jadvali
│   │   ├── 📄 tender_result.py      # tender_results jadvali (g'oliblar)
│   │   ├── 📄 tender_match.py       # tender_matches jadvali (moslik)
│   │   ├── 📄 bid.py                # bids jadvali (foydalanuvchi takliflari)
│   │   ├── 📄 subscription.py       # subscriptions jadvali
│   │   ├── 📄 payment.py            # payments jadvali
│   │   ├── 📄 notification.py       # notifications jadvali (yuborilgan xabarlar)
│   │   └── 📄 audit_log.py          # audit_logs jadvali (kim nima qildi)
│   │
│   ├── 📁 schemas/                  # Pydantic — validatsiya va serializatsiya
│   │   ├── 📄 __init__.py
│   │   ├── 📄 base.py               # Umumiy response/error schema
│   │   ├── 📄 auth.py               # LoginRequest, TokenResponse, ...
│   │   ├── 📄 user.py               # UserCreate, UserRead, UserUpdate
│   │   ├── 📄 company.py            # CompanyCreate, CompanyRead, ...
│   │   ├── 📄 tender.py             # TenderRead, TenderFilter, ...
│   │   ├── 📄 analytics.py          # CompetitorResponse, PriceHistory, ...
│   │   ├── 📄 ml.py                 # PricePredictRequest, PredictResponse
│   │   ├── 📄 document.py           # DocumentAnalyzeRequest, ChecklistResponse
│   │   ├── 📄 subscription.py       # SubscriptionRead, PlanInfo
│   │   ├── 📄 payment.py            # PaymentCreate, WebhookData
│   │   └── 📄 admin.py              # AdminStats, UserManage
│   │
│   ├── 📁 repositories/             # DB bilan bevosita ishlash qatlami
│   │   ├── 📄 __init__.py
│   │   ├── 📄 base.py               # BaseRepository (get, create, update, delete)
│   │   ├── 📄 user_repo.py          # UserRepository
│   │   ├── 📄 company_repo.py       # CompanyRepository
│   │   ├── 📄 tender_repo.py        # TenderRepository
│   │   ├── 📄 tender_result_repo.py # TenderResultRepository
│   │   ├── 📄 tender_match_repo.py  # TenderMatchRepository
│   │   ├── 📄 subscription_repo.py  # SubscriptionRepository
│   │   └── 📄 payment_repo.py       # PaymentRepository
│   │
│   ├── 📁 services/                 # Biznes logika qatlami
│   │   ├── 📄 __init__.py
│   │   ├── 📄 auth_service.py       # Login, register, token, API key
│   │   ├── 📄 tender_service.py     # Tenderlar CRUD, qidiruv, filter
│   │   ├── 📄 company_service.py    # Kompaniya profil boshqaruv
│   │   ├── 📄 matching_service.py   # TF-IDF + Cosine moslik algoritmi
│   │   ├── 📄 analytics_service.py  # Raqobatchi tahlili, bozor statistikasi
│   │   ├── 📄 ml_service.py         # ML model load, predict, retrain
│   │   ├── 📄 document_service.py   # PDF parse + Claude AI tahlil
│   │   ├── 📄 notification_service.py # Telegram + Email xabar yuborish
│   │   ├── 📄 subscription_service.py # Plan tekshirish, limit hisoblash
│   │   ├── 📄 payment_service.py    # Click/Payme integratsiya
│   │   ├── 📄 report_service.py     # PDF hisobot generatsiya
│   │   └── 📄 cache_service.py      # Redis cache wrapper
│   │
│   ├── 📁 scraper/                  # Ma'lumot yig'ish qatlami
│   │   ├── 📄 __init__.py
│   │   ├── 📄 base_scraper.py       # BaseScraper abstract class
│   │   ├── 📄 uzex_scraper.py       # xarid.uzex.uz scraper
│   │   ├── 📄 mc_scraper.py         # tender.mc.uz scraper
│   │   ├── 📄 mygov_scraper.py      # my.gov.uz scraper
│   │   ├── 📄 parser.py             # HTML/JSON dan ma'lumot ajratish
│   │   ├── 📄 cleaner.py            # Ma'lumot tozalash (narx, sana format)
│   │   └── 📄 deduplicator.py       # Dublikat tenderlarni aniqlash
│   │
│   ├── 📁 ml/                       # Machine Learning qatlami
│   │   ├── 📄 __init__.py
│   │   ├── 📄 base_model.py         # BaseMLModel abstract class
│   │   ├── 📄 price_model.py        # Random Forest narx bashorati
│   │   ├── 📄 matching_model.py     # TF-IDF + Cosine moslik
│   │   ├── 📄 anomaly_model.py      # Isolation Forest anomaliya
│   │   ├── 📄 trainer.py            # Model o'rgatish pipeline
│   │   ├── 📄 evaluator.py          # Model sifatini baholash (R², MAE)
│   │   ├── 📄 feature_engineering.py # Feature yaratish va transform
│   │   ├── 📄 uzbek_nlp.py          # O'zbek matni tozalash va tokenizatsiya
│   │   └── 📁 saved_models/         # .pkl fayllar (gitignore da!)
│   │       ├── price_model_v1.pkl
│   │       ├── price_model_v2.pkl   # Versiyalash muhim!
│   │       └── vectorizer_v1.pkl
│   │
│   ├── 📁 tasks/                    # Celery fon vazifalar
│   │   ├── 📄 __init__.py
│   │   ├── 📄 celery_app.py         # Celery instance va beat schedule
│   │   ├── 📄 scraping_tasks.py     # Scraping vazifalar
│   │   ├── 📄 matching_tasks.py     # Moslik hisoblash vazifalar
│   │   ├── 📄 notification_tasks.py # Bildirishnoma yuborish vazifalar
│   │   ├── 📄 ml_tasks.py           # Model qayta o'rgatish
│   │   ├── 📄 report_tasks.py       # Hisobot generatsiya
│   │   └── 📄 cleanup_tasks.py      # Eski ma'lumotlarni tozalash
│   │
│   ├── 📁 middleware/               # HTTP middleware qatlami
│   │   ├── 📄 __init__.py
│   │   ├── 📄 auth_middleware.py    # JWT tekshirish
│   │   ├── 📄 rate_limit.py         # So'rov cheklash (plan bo'yicha)
│   │   ├── 📄 logging_middleware.py # Har so'rovni log qilish
│   │   └── 📄 cors_middleware.py    # CORS sozlamalar
│   │
│   └── 📁 utils/                    # Yordamchi funksiyalar
│       ├── 📄 __init__.py
│       ├── 📄 security.py           # bcrypt, JWT, API key generatsiya
│       ├── 📄 pagination.py         # Sahifalash yordamchisi
│       ├── 📄 formatters.py         # Pul, sana, matn formatlash
│       ├── 📄 validators.py         # Maxsus validatsiya funksiyalar
│       ├── 📄 file_utils.py         # Fayl yuklash va saqlash
│       └── 📄 date_utils.py         # Sana hisoblamalari
│
├── 📁 bot/                          # Telegram bot (alohida modul)
│   ├── 📄 main.py                   # Bot entry point
│   ├── 📄 config.py                 # Bot sozlamalari
│   ├── 📁 handlers/                 # Buyruq va callback handlerlar
│   │   ├── 📄 __init__.py
│   │   ├── 📄 start.py              # /start, /help buyruqlari
│   │   ├── 📄 profile.py            # /profile — kompaniya sozlash (FSM)
│   │   ├── 📄 tenders.py            # /tenders — tender ko'rish
│   │   ├── 📄 analytics.py          # Raqobatchi va narx tahlili
│   │   ├── 📄 documents.py          # PDF yuklash va tahlil
│   │   └── 📄 subscription.py       # Plan va to'lov
│   ├── 📁 keyboards/                # Inline va reply tugmalar
│   │   ├── 📄 __init__.py
│   │   ├── 📄 inline.py             # Inline keyboard fabrikalar
│   │   └── 📄 reply.py              # Reply keyboard fabrikalar
│   ├── 📁 states/                   # FSM holatlari
│   │   ├── 📄 __init__.py
│   │   └── 📄 profile_states.py     # Profil to'ldirish bosqichlari
│   ├── 📁 middlewares/              # Bot middleware
│   │   ├── 📄 auth.py               # Foydalanuvchi tekshirish
│   │   └── 📄 subscription.py       # Plan tekshirish
│   └── 📁 utils/                    # Bot yordamchi funksiyalar
│       ├── 📄 formatters.py         # Xabar matnlarini formatlash
│       └── 📄 notifications.py      # Xabar yuborish yordamchisi
│
├── 📁 tests/                        # Barcha testlar
│   ├── 📄 conftest.py               # Test fixtures va sozlamalar
│   ├── 📄 factories.py              # Test ma'lumotlar yaratish
│   ├── 📁 unit/                     # Birlik testlar (tez, DB siz)
│   │   ├── 📄 test_matching.py      # Moslik algoritmi testlari
│   │   ├── 📄 test_price_model.py   # ML model testlari
│   │   ├── 📄 test_parser.py        # Scraper parser testlari
│   │   ├── 📄 test_formatters.py    # Formatlash testlari
│   │   └── 📄 test_validators.py    # Validatsiya testlari
│   ├── 📁 integration/              # Integratsiya testlar (DB bilan)
│   │   ├── 📄 test_auth_api.py      # Auth endpointlar
│   │   ├── 📄 test_tender_api.py    # Tender endpointlar
│   │   ├── 📄 test_payment_api.py   # To'lov endpointlar
│   │   └── 📄 test_scraper.py       # Scraper testlari
│   └── 📁 e2e/                      # Uchidan-uchiga testlar
│       └── 📄 test_full_flow.py     # Register→Profile→Tender→Notification
│
├── 📁 alembic/                      # DB migratsiyalar
│   ├── 📄 env.py
│   ├── 📄 alembic.ini
│   └── 📁 versions/                 # Har migration alohida fayl
│       ├── 📄 001_create_users.py
│       ├── 📄 002_create_companies.py
│       ├── 📄 003_create_tenders.py
│       └── 📄 004_add_subscriptions.py
│
├── 📁 docker/                       # Docker konfiguratsiyalar
│   ├── 📄 Dockerfile                # API uchun
│   ├── 📄 Dockerfile.bot            # Bot uchun
│   ├── 📄 Dockerfile.celery         # Celery uchun
│   └── 📄 nginx.conf                # Nginx konfiguratsiya
│
├── 📁 scripts/                      # Bir martalik yoki maintenance skriptlar
│   ├── 📄 seed_data.py              # Test ma'lumotlar yaratish
│   ├── 📄 historical_scrape.py      # 6 oylik tarixiy ma'lumot to'plash
│   ├── 📄 train_models.py           # ML modellarni o'rgatish
│   └── 📄 backup_db.py              # DB backup
│
├── 📁 docs/                         # Loyiha hujjatlari
│   ├── 📄 ARCHITECTURE.md           # Arxitektura sharhi (bu fayl)
│   ├── 📄 API.md                    # API endpoint hujjati
│   ├── 📄 DEPLOYMENT.md             # Deploy qo'llanmasi
│   ├── 📄 CONTRIBUTING.md           # Kodga qo'shilish qoidalari
│   └── 📁 diagrams/                 # Arxitektura diagrammalar
│       ├── 📄 system_overview.png
│       └── 📄 db_schema.png
│
├── 📁 monitoring/                   # Monitoring konfiguratsiyalar
│   ├── 📄 prometheus.yml            # Prometheus sozlamalar
│   └── 📁 grafana/                  # Grafana dashboardlar
│       └── 📄 tenderiq_dashboard.json
│
├── 📁 .github/                      # GitHub konfiguratsiyalar
│   ├── 📁 workflows/
│   │   ├── 📄 test.yml              # Har PR da testlar
│   │   ├── 📄 deploy-staging.yml    # dev branch → staging server
│   │   └── 📄 deploy-prod.yml       # main branch → production
│   └── 📁 ISSUE_TEMPLATE/
│       ├── 📄 bug_report.md
│       └── 📄 feature_request.md
│
├── 📄 docker-compose.yml            # Local development
├── 📄 docker-compose.staging.yml    # Staging muhit
├── 📄 docker-compose.prod.yml       # Production muhit
├── 📄 Dockerfile
├── 📄 requirements.txt              # Production dependencies
├── 📄 requirements-dev.txt          # Dev dependencies (pytest, black, ...)
├── 📄 pyproject.toml                # Black, isort, mypy sozlamalar
├── 📄 .env.example                  # Barcha kerakli o'zgaruvchilar
├── 📄 .gitignore
├── 📄 Makefile                      # Tez buyruqlar (make run, make test, ...)
└── 📄 README.md                     # Loyiha haqida — yangi dasturchi uchun
```

---

## QATLAMLAR TUSHUNTIRMASI

### 1. API qatlami (app/api/)
```
FAQAT shularni qiladi:
✅ HTTP so'rovni qabul qilish
✅ Schema bilan validatsiya
✅ Service ni chaqirish
✅ Javob qaytarish

QILMAYDI:
❌ Biznes logika
❌ DB bilan bevosita ishlash
❌ Hisoblash

Misol: auth.py
→ POST /register keladi
→ UserCreate schema bilan validatsiya
→ auth_service.register() chaqiradi
→ UserRead schema qaytaradi
```

### 2. Schemas qatlami (app/schemas/)
```
FAQAT shularni qiladi:
✅ Kiruvchi ma'lumotni tekshirish (request)
✅ Chiquvchi ma'lumotni formatlash (response)
✅ Pydantic modellari

Misol: tender.py
→ TenderFilter (request): category, region, min_amount
→ TenderRead (response): id, title, amount, deadline, match_score
→ TenderListResponse: items, total, page, per_page
```

### 3. Services qatlami (app/services/)
```
FAQAT shularni qiladi:
✅ Biznes logika
✅ Repository ni chaqirish
✅ Bir necha repository ni birlashtirish
✅ Tashqi API lar bilan ishlash

QILMAYDI:
❌ HTTP so'rov/javob bilan ishlash
❌ SQL yozish (repository orqali)

Misol: matching_service.py
→ TF-IDF algoritmi
→ Cosine similarity hisoblash
→ tender_match_repo.save() chaqirish
→ notification_service.notify() chaqirish
```

### 4. Repositories qatlami (app/repositories/)
```
FAQAT shularni qiladi:
✅ SQL so'rovlar (SQLAlchemy ORM)
✅ DB dan ma'lumot olish
✅ DB ga ma'lumot yozish

QILMAYDI:
❌ Biznes logika
❌ Tashqi API chaqirish

Misol: tender_repo.py
→ get_by_id(id) → Tender | None
→ get_filtered(category, region, page) → list[Tender]
→ create(data) → Tender
→ update(id, data) → Tender
→ get_new_since(timestamp) → list[Tender]
```

### 5. Models qatlami (app/models/)
```
FAQAT shularni qiladi:
✅ DB jadval tuzilmasini aniqlash
✅ Jadvallar orasidagi bog'liqliklar

Misol: tender.py
→ tenders jadvali
→ Column lar: id, title, amount, deadline, ...
→ Relationship: TenderResult, TenderMatch bilan
```

---

## HAR FAYLDA NIMA BO'LISHI KERAK

### app/main.py (Faqat 30-40 qator)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.router import api_router
from app.config import settings
from app.database import engine, Base
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.rate_limit import RateLimitMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown

app = FastAPI(
    title="TenderIQ API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Middleware (tartib muhim!)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(CORSMiddleware, allow_origins=settings.ALLOWED_ORIGINS)

# Routerlar
app.include_router(api_router, prefix="/api")

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
```

### app/config.py (Barcha sozlamalar)
```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App
    APP_NAME: str = "TenderIQ"
    DEBUG: bool = False
    SECRET_KEY: str
    
    # Database
    DATABASE_URL: str
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    
    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    REDIS_CACHE_TTL: int = 3600  # 1 soat
    
    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    
    # Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/1"
    
    # External APIs
    ANTHROPIC_API_KEY: str
    BOT_TOKEN: str
    CLICK_SERVICE_ID: str
    CLICK_MERCHANT_ID: str
    PAYME_MERCHANT_ID: str
    PAYME_SECRET_KEY: str
    
    # Scraper
    SCRAPER_INTERVAL_MINUTES: int = 20
    SCRAPER_HEADLESS: bool = True
    
    # Limits (plan bo'yicha)
    FREE_DAILY_LIMIT: int = 50
    PRO_DAILY_LIMIT: int = 500
    BUSINESS_DAILY_LIMIT: int = 5000
    
    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()  # Bir marta o'qiladi, cache da saqlanadi
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

### app/models/base.py (Barcha modellar meros oladi)
```python
from sqlalchemy import Column, Integer, DateTime, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class TimestampMixin:
    """Barcha jadvallar uchun umumiy vaqt ustunlari"""
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), 
                        onupdate=func.now(), nullable=False)

class BaseModel(Base, TimestampMixin):
    """Barcha modellar shu klassdan meros oladi"""
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    def to_dict(self) -> dict:
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} id={self.id}>"
```

### app/repositories/base.py (Barcha repolar meros oladi)
```python
from typing import TypeVar, Generic, Type, Optional
from sqlalchemy.orm import Session
from app.models.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)

class BaseRepository(Generic[ModelType]):
    """
    Barcha repository klasslari shu klassdan meros oladi.
    Asosiy CRUD operatsiyalar bir joyda.
    """
    
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db
    
    def get_by_id(self, id: int) -> Optional[ModelType]:
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> list[ModelType]:
        return self.db.query(self.model).offset(skip).limit(limit).all()
    
    def create(self, data: dict) -> ModelType:
        obj = self.model(**data)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj
    
    def update(self, id: int, data: dict) -> Optional[ModelType]:
        obj = self.get_by_id(id)
        if not obj:
            return None
        for key, value in data.items():
            setattr(obj, key, value)
        self.db.commit()
        self.db.refresh(obj)
        return obj
    
    def delete(self, id: int) -> bool:
        obj = self.get_by_id(id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True
    
    def count(self) -> int:
        return self.db.query(self.model).count()

# Foydalanish:
# class TenderRepository(BaseRepository[Tender]):
#     def __init__(self, db: Session):
#         super().__init__(Tender, db)
#
#     def get_by_category(self, category: str) -> list[Tender]:
#         return self.db.query(Tender).filter(Tender.category == category).all()
```

### app/exceptions.py (Barcha custom xatolar)
```python
from fastapi import HTTPException, status

class TenderIQException(Exception):
    """Asosiy exception klass"""
    def __init__(self, message: str, code: str = "UNKNOWN_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)

# Auth xatolari
class InvalidCredentialsError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Email yoki parol noto'g'ri"}
        )

class TokenExpiredError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_EXPIRED", "message": "Token muddati o'tgan"}
        )

# Biznes xatolari
class TenderNotFoundError(HTTPException):
    def __init__(self, tender_id: int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TENDER_NOT_FOUND", "message": f"Tender #{tender_id} topilmadi"}
        )

class PlanLimitExceededError(HTTPException):
    def __init__(self, plan: str, limit: int):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "PLAN_LIMIT_EXCEEDED",
                "message": f"{plan} rejasida kunlik {limit} ta so'rov limiti tugadi",
                "upgrade_url": "https://tenderiq.uz/pricing"
            }
        )

class SubscriptionRequiredError(HTTPException):
    def __init__(self, feature: str, min_plan: str):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "SUBSCRIPTION_REQUIRED",
                "message": f"'{feature}' funksiyasi uchun {min_plan} rejasi kerak",
                "upgrade_url": "https://tenderiq.uz/pricing"
            }
        )
```

### app/schemas/base.py (Umumiy response tuzilmasi)
```python
from pydantic import BaseModel
from typing import TypeVar, Generic, Optional, Any
from datetime import datetime

DataType = TypeVar("DataType")

class SuccessResponse(BaseModel, Generic[DataType]):
    """Muvaffaqiyatli javob uchun umumiy format"""
    success: bool = True
    data: DataType
    message: Optional[str] = None
    
class PaginatedResponse(BaseModel, Generic[DataType]):
    """Sahifalangan javob uchun umumiy format"""
    success: bool = True
    data: list[DataType]
    total: int
    page: int
    per_page: int
    total_pages: int

class ErrorResponse(BaseModel):
    """Xato javob uchun umumiy format"""
    success: bool = False
    error: dict[str, Any]
    timestamp: datetime = datetime.now()

# Foydalanish:
# @router.get("/tenders", response_model=PaginatedResponse[TenderRead])
# @router.get("/tenders/{id}", response_model=SuccessResponse[TenderRead])
```

### Makefile (Tez buyruqlar)
```makefile
.PHONY: run test lint format migrate

# Ishga tushirish
run:
	docker-compose up -d

run-dev:
	uvicorn app.main:app --reload --port 8000

# Testlar
test:
	pytest tests/ -v --cov=app --cov-report=term-missing

test-unit:
	pytest tests/unit/ -v

test-integration:
	pytest tests/integration/ -v

# Kod sifati
lint:
	flake8 app/ --max-line-length=100
	mypy app/ --ignore-missing-imports

format:
	black app/ bot/ tests/
	isort app/ bot/ tests/

# Database
migrate:
	alembic upgrade head

makemigration:
	alembic revision --autogenerate -m "$(msg)"

# Celery
worker:
	celery -A app.tasks.celery_app worker --loglevel=info

beat:
	celery -A app.tasks.celery_app beat --loglevel=info

flower:
	celery -A app.tasks.celery_app flower --port=5555

# Bot
bot:
	python bot/main.py

# Tozalash
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -name "*.pyc" -delete
```

### .env.example (Barcha o'zgaruvchilar)
```env
# App
APP_NAME=TenderIQ
DEBUG=false
SECRET_KEY=your-secret-key-here-min-32-chars

# Database
DATABASE_URL=postgresql://tenderiq_user:password@db:5432/tenderiq_db
DB_POOL_SIZE=10

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_HOURS=24

# Telegram Bot
BOT_TOKEN=your-telegram-bot-token

# Anthropic (Claude AI)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Click to'lov
CLICK_SERVICE_ID=your-click-service-id
CLICK_MERCHANT_ID=your-click-merchant-id
CLICK_SECRET_KEY=your-click-secret-key

# Payme to'lov
PAYME_MERCHANT_ID=your-payme-merchant-id
PAYME_SECRET_KEY=your-payme-secret-key

# Scraper
SCRAPER_INTERVAL_MINUTES=20
SCRAPER_HEADLESS=true

# Email (ixtiyoriy)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your-app-password

# Monitoring
SENTRY_DSN=your-sentry-dsn

# CORS
ALLOWED_ORIGINS=["http://localhost:3000","https://tenderiq.uz"]
```

---

## QATLAMLAR ORASIDAGI MA'LUMOT OQIMI

```
HTTP So'rov
    ↓
[Middleware] — Auth, Rate Limit, Logging
    ↓
[API Layer] — Validatsiya, so'rovni qabul qilish
    ↓
[Service Layer] — Biznes logika
    ↙           ↘
[Repository]  [External APIs]
    ↓          (Claude, Click, Payme)
[Database]
(PostgreSQL)

Alohida oqim (Celery):
[Celery Beat] → [Task] → [Scraper] → [Parser] → [Repository] → [DB]
                               ↓
                        [Matching Service] → [Notification Service] → [Bot/Email]
```

---

## NIMA UCHUN BUNDAY TUZILMA?

| Sabab | Tushuntirish |
|-------|-------------|
| **Separation of Concerns** | Har qatlam faqat o'z ishini qiladi |
| **Testlash oson** | Service ni DB siz test qilish mumkin |
| **O'zgartirish xavfsiz** | Repository ni o'zgartirsang — service ta'sirlanmaydi |
| **Yangi dasturchi** | 10 daqiqada tuzilmani tushunadi |
| **Kengaytiriladi** | Yangi feature — yangi fayl, eskisiga tegmaydi |
| **Versiyalash** | API v2 chiqarsa — /api/v2/ papka qo'shiladi |

---

*Versiya: 2.0 — Professional Edition*
*Har yangi qatlam qo'shilganda yangilansin*
