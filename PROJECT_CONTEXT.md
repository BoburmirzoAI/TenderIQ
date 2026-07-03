# TenderIQ — To'liq Loyiha Konteksti

Bu fayl yangi chat sessiyalarida loyihani tezda tushuntirish uchun yozilgan.

---

## Loyiha haqida

**TenderIQ** — O'zbekiston davlat tenderlarini kuzatish, tahlil qilish va AI yordamida bashorat qilish platformasi.

**Stack:**
- **Backend:** FastAPI + SQLAlchemy (async) + PostgreSQL + Redis + Celery
- **User Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Zustand
- **Admin Panel:** React + TypeScript + Vite (alohida loyiha)
- **ML:** scikit-learn, custom Python modellari
- **Deploy:** Docker Compose

**Papkalar:**
```
/Users/Developer/DRF/TenderIQ/
├── tender-backend/     ← FastAPI backend
├── tender-frontend/    ← Next.js user interfeysi
└── tender-admin/       ← React admin panel
```

---

## Backend tuzilmasi

```
tender-backend/app/
├── api/v1/             ← Barcha endpointlar (24 ta fayl)
│   ├── auth.py         ← Login, register, forgot/reset password, email verify
│   ├── tenders.py      ← Tenderlar CRUD + saqlash
│   ├── admin.py        ← Admin panel endpointlari (hozircha faqat 3 ta endpoint)
│   ├── ml.py           ← AI bashorat endpointlari
│   ├── analytics.py    ← Tahlil
│   ├── payments.py     ← Click, Payme to'lovlar
│   ├── subscriptions.py← Obuna (free/pro/business)
│   ├── notifications.py← Bildirishnomalar
│   ├── websocket.py    ← Real-time WebSocket
│   ├── companies.py    ← Kompaniya ma'lumotlari
│   ├── teams.py        ← Jamoa boshqaruvi
│   ├── reports.py      ← PDF/Excel hisobotlar
│   ├── pricing.py      ← Narx strategiyasi
│   ├── competitors.py  ← Raqobatchilar
│   ├── documents.py    ← Hujjat tekshirish
│   ├── journal.py      ← Win/Loss kundalik
│   ├── saved_searches.py
│   ├── tender_map.py
│   ├── applications.py ← Pipeline (kanban)
│   └── notes.py
├── models/             ← SQLAlchemy modellari (15 ta)
├── schemas/            ← Pydantic schemalar (18 ta)
├── services/           ← Biznes logika (14 ta)
├── repositories/       ← DB so'rovlar (9 ta)
├── ml/                 ← ML modellari (12 ta fayl)
│   ├── base_model.py
│   ├── win_probability_model.py
│   ├── price_model.py
│   ├── optimal_bid_model.py
│   ├── risk_assessment_model.py
│   ├── tender_similarity_model.py
│   ├── matching_model.py
│   ├── anomaly_model.py
│   ├── trend_forecast_model.py
│   ├── uzbek_nlp.py
│   ├── feature_engineering.py
│   ├── evaluator.py
│   └── trainer.py
├── scraper/            ← Uzex, MC, MyGov scraperlar
├── tasks/              ← Celery tasks (7 ta)
├── middleware/         ← Auth, CORS, logging, rate limit
└── utils/              ← Yordamchi funksiyalar
```

**Response format** (barcha endpointlar):
```python
# Muvaffaqiyat
{"success": true, "data": {...}, "message": "..."}

# Xato
{"success": false, "error": "..."}

# Sahifalash
{"success": true, "data": [...], "total": 100, "page": 1, "per_page": 20, "total_pages": 5, "has_next": true, "has_prev": false}
```

**Muhim:** `DATABASE_URL=postgresql+asyncpg://tenderiq:tenderiq@db:5432/tenderiq` — Docker ichida ishlaydi.

---

## User Frontend tuzilmasi

```
tender-frontend/src/
├── app/
│   ├── (auth)/
│   │   ├── login/          ← Email/parol bilan kirish
│   │   ├── register/       ← Ro'yxatdan o'tish
│   │   ├── forgot-password/← Parol tiklash so'rovi
│   │   ├── reset-password/ ← Yangi parol (?token=...)
│   │   └── verify-email/   ← Email tasdiqlash (?token=...)
│   └── (dashboard)/        ← 22 ta sahifa, hammasi real backend bilan
│       ├── dashboard/      ← Bosh sahifa + WebSocket
│       ├── tenders/        ← Tenderlar ro'yxati + [id] detail
│       ├── matched/        ← AI mos tenderlar
│       ├── pipeline/       ← Kanban board
│       ├── ml/             ← AI bashorat (5 tab)
│       ├── analytics/      ← Tahlil (4 tab)
│       ├── reports/        ← PDF/Excel yuklab olish
│       ├── calendar/       ← Tender kalendari
│       ├── compare/        ← Tenderlarni solishtirish
│       ├── budget/         ← Narx kalkulyator (client-side only)
│       ├── competitors/    ← Raqobatchilar
│       ├── pricing/        ← Narx strategiyasi
│       ├── teams/          ← Jamoa boshqaruvi
│       ├── map/            ← Tender xaritasi
│       ├── journal/        ← Win/Loss kundalik
│       ├── documents/      ← Hujjat tekshirish
│       ├── notifications/  ← Bildirishnomalar
│       ├── company/        ← Kompaniya
│       ├── payments/       ← To'lovlar
│       ├── subscription/   ← Obuna
│       └── settings/       ← Sozlamalar (6 tab)
├── components/
│   ├── layout/
│   │   ├── header.tsx      ← Qidiruv + dark mode toggle + notification badge
│   │   └── sidebar-nav.tsx ← 21 ta menyu elementi
│   └── ui/                 ← shadcn/ui komponentlari
├── store/
│   ├── auth.ts             ← Zustand auth store (login/logout/loadUser)
│   └── notifications.ts    ← Global unread count store
├── hooks/
│   ├── use-websocket.ts    ← WebSocket hook (auto-reconnect)
│   └── use-notification-ws.ts ← WebSocket + toast + badge yangilash
└── lib/
    └── api.ts              ← Axios instance (401 interceptor, token refresh)
```

**Muhim:** `api.ts` dagi 401 interceptor `login`, `register`, `refresh` URL larini o'tkazib yuboradi — aks holda noto'g'ri parolda redirect loop bo'ladi.

---

## Admin Panel tuzilmasi

```
tender-admin/src/
├── layouts/AdminLayout.tsx ← Sidebar + header + toast tizimi
├── pages/                  ← 33 ta sahifa (hammasi hozircha MOCK DATA)
│   ├── Dashboard.tsx
│   ├── Users.tsx           ← Xabar yuborish modali bor
│   ├── Tenders.tsx
│   ├── Companies.tsx
│   ├── Financials.tsx
│   ├── Integrations.tsx    ← Celery task cron editor bor
│   ├── Settings.tsx        ← env tab olib tashlangan (xavfsizlik)
│   ├── AuditLog.tsx        ← Yangi
│   ├── PromoCodes.tsx      ← Yangi
│   ├── APIKeys.tsx         ← Yangi
│   ├── EmailTemplates.tsx  ← Yangi
│   └── ... (boshqalar)
└── hooks/useAdmin.ts       ← Toast tizimi
```

**Muhim:** Admin panel hozircha backend bilan ulanmagan — barcha sahifalar mock data ishlatadi. Backend `/api/v1/admin/` routeri bor lekin faqat 3 ta endpoint mavjud (stats, users list, user update).

---

## Amalga oshirilgan asosiy ishlar

### User Frontend
- [x] 22 ta sahifa — hammasi real backend bilan ulangan
- [x] Login bug tuzatildi (401 interceptor + auth endpointlar)
- [x] Parol tiklash: `POST /v1/auth/forgot-password`, `POST /v1/auth/reset-password`
- [x] Email tasdiqlash: `POST /v1/auth/send-verification`, `POST /v1/auth/verify-email`
- [x] WebSocket real-time bildirishnomalar + notification badge (Zustand store)
- [x] Header da dark mode toggle (Light/Dark/System)
- [x] Mobile responsiveness — jadval sahifalarda `overflow-x-auto`
- [x] TypeScript xatolari tuzatildi (pricing API prefix, map/teams/journal Select types)

### Admin Panel
- [x] AuditLog, PromoCodes, APIKeys, EmailTemplates sahifalari yaratildi
- [x] Dashboard quick action modallari
- [x] Users sahifasida xabar yuborish modali
- [x] Integrations: Celery task cron editor
- [x] Settings: env tab olib tashlandi (xavfsizlik)
- [x] Integrations bug tuzatildi (qora ekran masalasi)

### Backend
- [x] Parol tiklash endpointlari (Redis orqali token, 15 daqiqa TTL)
- [x] Email tasdiqlash endpointlari (Redis, 24 soat TTL)
- [x] Email shablonlari: `password_reset.html`, `email_verification.html`
- [x] `notification_service.py` ga yangi metodlar qo'shildi

---

## Qolgan ishlar (navbat bo'yicha)

### Muhim
1. **Admin panel → real backend ulash** (eng katta ish)
   - Backend: `/api/v1/admin/` ga 40+ yangi endpoint kerak
   - Schemas allaqachon yozilgan (`schemas/admin.py` — to'liq)
   - Frontend: har bir sahifada mock datani API chaqiruvlarga almashtirish

2. **Backend refaktoring** (ixtiyoriy, keyinroq)
   - Hozir: layer-based (`models/`, `services/`, `repositories/` — hammasi aralash)
   - Taklif: domain-based (`auth/`, `tender/`, `payment/` — har biri o'z papkasida)
   - `ml/` va `scraper/` allaqachon domain-based — shu formatga o'tkazish

---

## Muhim texnik ma'lumotlar

**Admin panel auth:** `tender-admin/src/hooks/useAdmin.ts` — oddiy `localStorage` da `admin_token` saqlaydi (hozircha mock)

**WebSocket URL:** `ws://localhost:8000/api/ws/tenders?token=<access_token>`

**WebSocket eventlar (backend yuboradi):**
- `new_tender` — yangi tender qo'shildi (broadcast)
- `notification` — foydalanuvchiga shaxsiy bildirishnoma
- `stats_update` — statistika yangilandi (broadcast)
- `activity` — tizim faoliyati (broadcast)

**Subscription planlari:** `free`, `pro`, `business`

**To'lov provayderlari:** Click.uz, Payme

**Email:** SMTP sozlangan (`sobirjonovboburmirzo7@gmail.com` orqali)

**Telegram bot:** Ulangan (`TELEGRAM_BOT_TOKEN` `.env` da)

**DB:** Docker container `tender-backend-db-1` ichida. Tekshirish:
```bash
docker exec tender-backend-db-1 psql -U tenderiq -d tenderiq -c "SELECT id, email, is_admin FROM users;"
```

**Backend syntax tekshirish:**
```bash
cd /Users/Developer/DRF/TenderIQ/tender-backend
python -c "from app.api.v1.auth import router; print('OK')"
```

**Frontend TypeScript tekshirish:**
```bash
cd /Users/Developer/DRF/TenderIQ/tender-frontend
npx tsc --noEmit
```
