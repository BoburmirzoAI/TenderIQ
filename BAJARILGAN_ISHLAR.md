# TenderIQ — Bajarilgan ishlar

> O'zbekiston davlat tenderlari uchun AI-powered razvedka platformasi
> Oxirgi yangilanish: 2026-yil 14-iyun

---

## Umumiy ko'rinish

| Bo'lim | Texnologiya | Fayllar soni | Holati |
|--------|-------------|:------------:|:------:|
| Backend API | FastAPI + SQLAlchemy 2.0 async | 103 ta `.py` | Ishlayapti |
| Telegram Bot | Aiogram 3.x | 21 ta `.py` | Ishlayapti |
| Frontend | Next.js 16 + TypeScript + shadcn/ui | 48 ta `.ts/.tsx` | Ishlayapti |
| Infra | Docker Compose (8 servis) | Dockerfile, docker-compose.yml, Makefile | Ishlayapti |

---

## 1. Backend (FastAPI)

**Joylashuv:** `/tender-backend/`

### 1.1 API Endpointlar (10 ta router)

| Router | Prefix | Endpointlar |
|--------|--------|-------------|
| **Auth** | `/api/v1/auth` | `POST /register`, `POST /login`, `POST /refresh`, `GET /me`, `POST /change-password`, `POST /api-key` |
| **Tenders** | `/api/v1/tenders` | `GET /` (filtr + pagination), `GET /{id}`, `GET /matched/`, `POST /save/{match_id}`, `GET /search/` |
| **Companies** | `/api/v1/companies` | `POST /`, `GET /me`, `PATCH /me`, `GET /stats` |
| **Analytics** | `/api/v1/analytics` | `GET /competitors`, `GET /price-history`, `GET /market`, `GET /anomalies` |
| **Subscriptions** | `/api/v1/subscriptions` | `GET /current`, `GET /plans`, `GET /usage` |
| **Payments** | `/api/v1/payments` | Click.uz va Payme integratsiya (placeholder) |
| **Documents** | `/api/v1/documents` | Hujjat yuklash va tahlil qilish |
| **ML** | `/api/v1/ml` | Model predict, retrain |
| **Admin** | `/api/v1/admin` | Foydalanuvchilar, tenderlar, audit log boshqaruvi |
| **WebSocket** | `/ws` | Real-time bildirishnomalar |

### 1.2 Ma'lumotlar bazasi modellari (10 ta)

| Model | Fayl | Tavsif |
|-------|------|--------|
| `User` | `models/user.py` | Foydalanuvchi (email, parol, telegram_id, til) |
| `Company` | `models/company.py` | Kompaniya profili (STIR, kategoriyalar, viloyatlar) |
| `Tender` | `models/tender.py` | Tender e'lonlari (sarlavha, summa, muddat, manba) |
| `TenderMatch` | `models/tender_match.py` | Kompaniya-tender mosligi (ML ball) |
| `TenderResult` | `models/tender_result.py` | Tender natijalari (g'oliblar) |
| `Subscription` | `models/subscription.py` | Obuna holati (reja, muddati) |
| `Payment` | `models/payment.py` | To'lov tranzaksiyalari |
| `Bid` | `models/bid.py` | Tender arizalari |
| `Notification` | `models/notification.py` | Bildirishnomalar |
| `AuditLog` | `models/audit_log.py` | Admin harakatlari logi |

### 1.3 Servislar (12 ta)

- **AuthService** — Registratsiya, login, JWT token yaratish/yangilash
- **TenderService** — Tenderlarni ro'yxatlash, qidirish, filtrlash
- **CompanyService** — Kompaniya profili CRUD
- **AnalyticsService** — Raqobatchilar tahlili, bozor statistikasi, narx tarixi
- **SubscriptionService** — Obuna rejalarini boshqarish, usage tracking
- **PaymentService** — Click/Payme to'lov integratsiya (placeholder)
- **MatchingService** — Tender-kompaniya mosligini hisoblash
- **MLService** — Machine learning model prediksiyalari
- **DocumentService** — PDF hujjatlarni tahlil qilish (PyMuPDF)
- **ReportService** — Hisobot generatsiya (ReportLab)
- **NotificationService** — Telegram/email bildirishnomalar
- **CacheService** — Redis cache boshqaruvi

### 1.4 ML modullari (8 ta)

| Modul | Vazifasi |
|-------|---------|
| `matching_model.py` | Tender-kompaniya moslik bali (TF-IDF + cosine similarity) |
| `price_model.py` | Narx bashorat qilish |
| `anomaly_model.py` | Shubhali tender patternlarni aniqlash |
| `uzbek_nlp.py` | O'zbek tili uchun NLP (stemming, stop words) |
| `feature_engineering.py` | ML uchun feature tayyorlash |
| `trainer.py` | Model o'qitish pipeline |
| `evaluator.py` | Model sifatini baholash |
| `base_model.py` | Bazaviy model klassi |

### 1.5 Scraper modullari (6 ta)

| Modul | Manba |
|-------|-------|
| `mygov_scraper.py` | my.gov.uz — davlat xaridlari portali |
| `uzex_scraper.py` | uzex.uz — O'zbekiston tovar-xom ashyo birjasi |
| `mc_scraper.py` | mc.uz — Moliya vazirligi |
| `parser.py` | HTML parsing va ma'lumot ajratish |
| `cleaner.py` | Ma'lumotlarni tozalash (summa, sana, kategoriya, viloyat) |
| `deduplicator.py` | Dublikatlarni aniqlash va olib tashlash |

### 1.6 Celery vazifalar (7 ta modul)

| Modul | Vazifasi |
|-------|---------|
| `scraping_tasks.py` | Tenderlarni avtomatik yig'ish (jadval bo'yicha) |
| `matching_tasks.py` | Tender-kompaniya mosligini hisoblash |
| `ml_tasks.py` | ML modellarni qayta o'qitish |
| `notification_tasks.py` | Bildirishnomalar yuborish |
| `report_tasks.py` | Hisobotlar generatsiya |
| `cleanup_tasks.py` | Eski ma'lumotlarni tozalash |
| `celery_app.py` | Celery konfiguratsiya va beat jadval |

### 1.7 Middleware

- **CORSMiddleware** — Cross-origin so'rovlarga ruxsat (localhost:3000, localhost:8000)
- **RateLimitMiddleware** — Redis-based kunlik so'rov limiti (reja bo'yicha)
- **LoggingMiddleware** — So'rov/javob loglash
- **GZipMiddleware** — Response kompressiya
- **AuthMiddleware** — JWT token tekshirish

### 1.8 Obuna rejalari

| Reja | Narx | Kunlik so'rov | ML | API | Hujjat tahlili | Saqlash |
|------|------|:------------:|:--:|:---:|:--------------:|:-------:|
| Free | 0 UZS | 50 | - | - | - | 10 ta |
| Pro | 299,000 UZS/oy | 500 | + | - | + | 500 ta |
| Business | 990,000 UZS/oy | 5,000 | + | + | + | Cheksiz |

---

## 2. Telegram Bot (@TendersIQbot)

**Joylashuv:** `/tender-backend/bot/`

### 2.1 Handlerlar

| Handler | Buyruq/Callback | Vazifasi |
|---------|----------------|---------|
| `start.py` | `/start` | Xush kelibsiz xabar, asosiy menyu |
| `profile.py` | Profil tugmasi | Kompaniya profili yaratish/ko'rish |
| `tenders.py` | Tenderlar tugmasi | Tenderlarni qidirish, ko'rish |
| `subscription.py` | Obuna tugmasi | Reja tanlash, to'lov |
| `analytics.py` | Analitika tugmasi | Bozor statistikasi |
| `documents.py` | Hujjatlar tugmasi | PDF yuborish va tahlil |

### 2.2 Middleware

- **AuthMiddleware** — Telegram foydalanuvchini DB da tekshirish/yaratish
- **SubscriptionMiddleware** — Obuna holatini tekshirish

### 2.3 Klaviaturalar

- **Inline** — Callback tugmalar (obuna rejalari, tenderlar, boshqalar)
- **Reply** — Asosiy menyu tugmalari

---

## 3. Frontend (Next.js)

**Joylashuv:** `/tender-frontend/`

### 3.1 Texnologiyalar

| Texnologiya | Versiya | Vazifasi |
|-------------|---------|---------|
| Next.js | 16.2 | React framework (App Router) |
| TypeScript | 5.x | Tip xavfsizligi |
| Tailwind CSS | 4.x | Stillar |
| shadcn/ui | v4 (base-ui) | UI komponentlar (27 ta) |
| Zustand | latest | State management |
| Axios | latest | HTTP client |
| Recharts | latest | Diagrammalar |
| Lucide React | latest | Ikonkalar |
| date-fns | latest | Sana formatlash |

### 3.2 Sahifalar (10 ta)

| Sahifa | Yo'l | Vazifasi |
|--------|------|---------|
| Login | `/login` | Email + parol bilan kirish |
| Register | `/register` | Yangi hisob yaratish (ism, email, telefon, parol) |
| Dashboard | `/dashboard` | Statistika kartalar, so'nggi tenderlar, obuna holati |
| Tenderlar | `/tenders` | Tenderlar ro'yxati (filtr: kategoriya, viloyat, holat, qidiruv + pagination) |
| Tender tafsilot | `/tenders/[id]` | Tender batafsil (tavsif, talablar, summa, moslik bali, saqlash) |
| Analitika | `/analytics` | Viloyat/kategoriya diagrammalari, raqobatchilar jadvali |
| Kompaniya | `/company` | Kompaniya profili yaratish/tahrirlash (STIR, kategoriyalar, viloyatlar) |
| Obuna | `/subscription` | Free/Pro/Business rejalari, joriy foydalanish |
| Sozlamalar | `/settings` | Profil, parol o'zgartirish, API kalit |
| Bosh sahifa | `/` | Dashboard'ga redirect |

### 3.3 Arxitektura

```
src/
├── app/
│   ├── (auth)/              # Auth layout (kirish/ro'yxatdan o'tish)
│   │   ├── layout.tsx       # Auth guard (login bo'lsa → dashboard)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/         # Dashboard layout (sidebar + header)
│   │   ├── layout.tsx       # Auth guard (login bo'lmasa → login)
│   │   ├── dashboard/page.tsx
│   │   ├── tenders/page.tsx
│   │   ├── tenders/[id]/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── company/page.tsx
│   │   ├── subscription/page.tsx
│   │   └── settings/page.tsx
│   ├── layout.tsx           # Root layout (Toaster, fontlar)
│   └── page.tsx             # / → /dashboard redirect
├── components/
│   ├── layout/
│   │   ├── sidebar-nav.tsx  # Sidebar navigatsiya (6 ta link + logout)
│   │   └── header.tsx       # Top bar (qidiruv, bildirishnoma, profil)
│   └── ui/                  # 27 ta shadcn/ui komponentlar
├── lib/
│   ├── api.ts               # Axios instance (auto token refresh, interceptors)
│   ├── format.ts            # Formatlash (summa, sana, kategoriya, viloyat, status)
│   └── utils.ts             # cn() utility
├── store/
│   └── auth.ts              # Zustand auth store (login, register, logout, loadUser)
└── types/
    └── index.ts             # TypeScript interfeys va konstantalar
```

### 3.4 UI komponentlar (shadcn/ui)

Avatar, Badge, Button, Calendar, Card, Chart, Command, Dialog, Dropdown Menu, Input, Input Group, Label, Navigation Menu, Popover, Progress, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Sonner (toast), Switch, Table, Tabs, Textarea, Tooltip

---

## 4. Infra (Docker Compose)

### 4.1 Servislar (8 ta)

| Servis | Image | Port | Vazifasi |
|--------|-------|:----:|---------|
| **api** | tender-backend-api | 8000 | FastAPI server |
| **bot** | tender-backend-bot | — | Telegram bot (polling) |
| **celery_worker** | tender-backend-celery | — | Asinxron vazifalar |
| **celery_beat** | tender-backend-beat | — | Jadval bo'yicha vazifalar |
| **db** | postgres:16-alpine | 5432 | PostgreSQL |
| **redis** | redis:7-alpine | 6379 | Cache + Celery broker |
| **pgadmin** | dpage/pgadmin4 | 5050 | DB boshqaruv paneli |
| **flower** | tender-backend-flower | 5555 | Celery monitoring |

### 4.2 Makefile buyruqlar

| Buyruq | Vazifasi |
|--------|---------|
| `make run` | Barcha servislarni ishga tushirish |
| `make run-dev` | Development rejimda ishga tushirish |
| `make stop` | Barcha servislarni to'xtatish |
| `make test` | Testlarni ishga tushirish |
| `make migrate` | DB migratsiyalarni qo'llash |

---

## 5. Tuzatilgan xatolar

| Xatolik | Sabab | Yechim |
|---------|-------|--------|
| Bot crash — bo'sh token | `TELEGRAM_BOT_TOKEN` o'rnatilmagan | `PLACEHOLDER_TOKENS` tekshiruvi qo'shildi |
| Bot crash — noto'g'ri token | Token oxirida ortiqcha belgilar | Token tekshirildi va to'g'rilandi |
| API crash — `email_validator` yo'q | `requirements.txt` da yo'q edi | `email-validator` va `pydantic[email]` qo'shildi |
| Redis/DB connection refused | `.env` da `localhost` ishlatilgan | Docker servis nomlari (`redis`, `db`) ga o'zgartirildi |
| `passlib` + `bcrypt>=4.1` mos emas | `passlib` yangilanmagan | `passlib` olib tashlandi, `bcrypt` to'g'ridan-to'g'ri ishlatildi |
| CORS bloklash | `.env` dagi JSON string noto'g'ri parse qilingan | `field_validator` qo'shildi |
| `/auth/me` 404 | Endpoint mavjud emas edi | `GET /api/v1/auth/me` endpoint qo'shildi |
| Rate limit 429 | Anonim limit 10 ta so'rov edi | 200 ga oshirildi (development) |
| Flower crash | `flower` paketi o'rnatilmagan | `requirements.txt` ga qo'shildi |
