# TenderIQ — To'liq Yo'l Xaritasi
> **6 oy • 24 hafta • MVP dan biznesgacha**
> 
> Bu hujjat sening har kuni nima qilishingni ko'rsatuvchi aniq yo'l xaritasi.

---

## MUNDARIJA
1. [Umumiy ko'rinish](#1-umumiy-korinish)
2. [1-oy — Poydevor](#2-1-oy--poydevor)
3. [2-oy — Scraping + Telegram Bot](#3-2-oy--scraping--telegram-bot)
4. [3-oy — ML Modellari](#4-3-oy--ml-modellari)
5. [4-oy — AI + Frontend MVP](#5-4-oy--ai--frontend-mvp)
6. [5-oy — SaaS + To'lov](#6-5-oy--saas--tolov)
7. [6-oy — Launch + O'sish](#7-6-oy--launch--osish)
8. [Har kuni nima qilish kerak](#8-har-kuni-nima-qilish-kerak)
9. [Texnologiyalar — O'rganish tartibi](#9-texnologiyalar--organish-tartibi)
10. [Oltin Qoidalar](#10-oltin-qoidalar)

---

## 1. UMUMIY KO'RINISH

```
OY        MAQSAD                          NATIJA
──────────────────────────────────────────────────────────────────
1-oy  →   Poydevor + Scraper              100+ tender bazada, API ishlaydi
2-oy  →   Matching + Telegram Bot        10 beta kompaniya xabar olmoqda
3-oy  →   ML + Raqobatchi tahlili        Narx bashorati ishlaydi
4-oy  →   AI + Web Dashboard             Pro feature'lar tayyor
5-oy  →   To'lov + Admin panel           Birinchi pullik mijoz!
6-oy  →   Launch + Marketing             ~$7,500/oy MRR
```

### Kun rejasi (har kuni)
```
08:00 - 09:00   Kecha yozilgan kodlarni review
09:00 - 13:00   Asosiy kod yozish (4 soat — eng unumli vaqt)
13:00 - 14:00   Ovqat + dam olish
14:00 - 17:00   Feature davom ettirish yoki testlar
17:00 - 18:00   Git commit, PR, hujjat
18:00 - 19:00   O'rganish (YouTube, doc, kitob)
```

---

## 2. 1-OY — POYDEVOR

**Maqsad:** `docker-compose up` qilsang — hamma servis ishlaydi, tenderlar DB ga yig'iladi.

---

### 📅 1-HAFTA: Muhit va Loyiha Skeleti

**Nima qilasan:**

#### Dushanba
```bash
# GitHub repo yaratish
git init tenderiq
cd tenderiq
git remote add origin https://github.com/sening/tenderiq.git

# Branch strategiyasi
git checkout -b dev
# Har bir feature uchun: git checkout -b feature/scraper
```

#### Seshanba — docker-compose.yml
```yaml
version: '3.9'
services:
  api:
    build: .
    ports: ["8000:8000"]
    depends_on: [db, redis]
    env_file: .env

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: tenderiq_db
      POSTGRES_USER: tenderiq_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine

  celery_worker:
    build: .
    command: celery -A app.tasks.celery_app worker --loglevel=info
    depends_on: [api, redis]

  celery_beat:
    build: .
    command: celery -A app.tasks.celery_app beat --loglevel=info
    depends_on: [redis]

volumes:
  postgres_data:
```

#### Chorshanba — Papka tuzilmasi
```
tenderiq/
├── app/
│   ├── main.py           ← FastAPI entry point
│   ├── config.py         ← .env sozlamalar
│   ├── database.py       ← DB ulanish
│   ├── api/v1/
│   │   ├── auth.py
│   │   ├── tenders.py
│   │   ├── analytics.py
│   │   ├── ml.py
│   │   └── subscriptions.py
│   ├── models/
│   │   ├── user.py
│   │   ├── tender.py
│   │   └── subscription.py
│   ├── services/
│   │   ├── matching_service.py
│   │   ├── ml_service.py
│   │   └── notification_service.py
│   ├── scraper/
│   │   ├── uzex_scraper.py
│   │   └── parser.py
│   ├── ml/
│   │   ├── price_model.py
│   │   └── matching_model.py
│   └── tasks/
│       ├── scraping_tasks.py
│       └── notification_tasks.py
├── bot/
│   ├── main.py
│   └── handlers/
├── tests/
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── .env.example
```

#### Payshanba-Juma — requirements.txt va "Hello World"
```
fastapi==0.110.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.27
alembic==1.13.1
pydantic[email]==2.6.0
pydantic-settings==2.2.1
psycopg2-binary==2.9.9
redis==5.0.1
celery==5.3.6
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
httpx==0.27.0
playwright==1.42.0
scikit-learn==1.4.0
pandas==2.2.0
numpy==1.26.4
anthropic==0.19.0
aiogram==3.4.1
pymupdf==1.24.0
reportlab==4.1.0
pytest==8.1.0
pytest-asyncio==0.23.5
```

**✅ 1-hafta natija:** `docker-compose up` → `localhost:8000/docs` ochiladi

---

### 📅 2-HAFTA: Ma'lumotlar Bazasi va Auth

#### DB Modellari (models/user.py)
```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)  # bcrypt hash
    full_name = Column(String(255))
    phone = Column(String(20))
    api_key = Column(String(64), unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
```

#### Auth API (api/v1/auth.py)
```python
# Quyidagi endpointlar:
POST /api/v1/auth/register    → {"email": "...", "password": "..."}
POST /api/v1/auth/login       → {"access_token": "...", "token_type": "bearer"}
GET  /api/v1/auth/me          → {"id": 1, "email": "...", ...}
POST /api/v1/auth/refresh     → yangi token
```

**✅ 2-hafta natija:** Postman da register → login → token olish ishlaydi

---

### 📅 3-HAFTA: Birinchi Scraper

#### Qanday yondashuv:
```
1. xarid.uzex.uz saytini brauzerdə och
2. F12 → Network tab → "XHR/Fetch" filter
3. Sahifani yangilash → API so'rovlarni ko'r
4. Tender ro'yxati qaysi URL dan kelayotganini topish
5. Playwright bilan o'sha URL ga so'rov yuborish
```

#### Scraper tuzilmasi (scraper/uzex_scraper.py)
```python
from playwright.async_api import async_playwright
import asyncio

class UzexScraper:
    BASE_URL = "https://xarid.uzex.uz"
    
    async def fetch_tenders_page(self, page_num: int) -> list:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto(f"{self.BASE_URL}/tenders?page={page_num}")
            await page.wait_for_selector(".tender-item", timeout=10000)
            
            tenders = await page.evaluate("""
                () => Array.from(document.querySelectorAll('.tender-item')).map(el => ({
                    title: el.querySelector('.title')?.textContent?.trim(),
                    amount: el.querySelector('.amount')?.textContent?.trim(),
                    deadline: el.querySelector('.deadline')?.textContent?.trim(),
                    org: el.querySelector('.org')?.textContent?.trim(),
                    external_id: el.dataset.id
                }))
            """)
            
            await browser.close()
            return tenders
    
    def parse_amount(self, amount_str: str) -> int:
        # "1 200 000 so'm" → 1200000
        cleaned = amount_str.replace(" ", "").replace("so'm", "").strip()
        return int(cleaned) if cleaned.isdigit() else 0
```

**✅ 3-hafta natija:** `python -m app.scraper.uzex_scraper` → 100 ta tender DB da

---

### 📅 4-HAFTA: Celery va Avtomatik Scraping

```python
# tasks/scraping_tasks.py
from celery import Celery
from celery.schedules import crontab

celery_app = Celery("tenderiq", broker="redis://redis:6379/0")

celery_app.conf.beat_schedule = {
    # Har 20 daqiqada xarid.uzex.uz ni tekshir
    "scrape-uzex": {
        "task": "app.tasks.scraping_tasks.scrape_uzex",
        "schedule": crontab(minute="*/20"),
    },
    # Har kuni 06:00 da ML model qayta o'rgatiladi
    "retrain-model": {
        "task": "app.tasks.ml_tasks.retrain_price_model",
        "schedule": crontab(hour=6, minute=0),
    },
}

@celery_app.task
def scrape_uzex():
    """Har 20 daqiqada yangi tenderlarni yig'adi"""
    from app.scraper.uzex_scraper import UzexScraper
    scraper = UzexScraper()
    new_tenders = scraper.fetch_new_only()  # Faqat yangilarini
    
    for tender in new_tenders:
        # Har yangi tender uchun matching ishga tushadi
        process_new_tender.delay(tender.id)
    
    return f"{len(new_tenders)} ta yangi tender topildi"

@celery_app.task
def process_new_tender(tender_id: int):
    """Yangi tender → mos kompaniyalar → bildirishnoma"""
    matched_companies = find_matching_companies(tender_id)
    if matched_companies:
        send_notifications.delay(tender_id, [c.id for c in matched_companies])
```

**✅ 1-OY YAKUNIY NATIJA:**
- `docker-compose up` — hamma servis ishlaydi
- Har 20 daqiqada avtomatik scraping
- 6 oylik tarixiy ma'lumot to'plangan
- Auth API (register/login) ishlaydi

---

## 3. 2-OY — SCRAPING + TELEGRAM BOT

**Maqsad:** 10 ta beta kompaniya Telegram da tender xabari olmoqda.

---

### 📅 5-HAFTA: Matching Algoritmi

```python
# services/matching_service.py
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class TenderMatchingService:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            analyzer='word',
            ngram_range=(1, 2),  # "qurilish ta'miri" kabi iboralar
            min_df=1,
            max_features=10000
        )
    
    def calculate_match_score(self, tender, company) -> float:
        """
        4 mezon bo'yicha moslik hisoblanadi:
        
        Matn moslik (TF-IDF)    : 60% og'irlik
        Kategoriya moslik        : 25% og'irlik  
        Hudud moslik             : 10% og'irlik
        Narx diapazoni           :  5% og'irlik
        """
        # 1. Matn moslik
        tender_text = self._preprocess(f"{tender.title} {tender.description}")
        company_text = self._preprocess(
            f"{company.name} {company.description} {' '.join(company.categories)}"
        )
        
        matrix = self.vectorizer.fit_transform([tender_text, company_text])
        text_score = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
        
        # 2. Kategoriya moslik
        cat_score = 1.0 if tender.category in company.categories else 0.0
        
        # 3. Hudud moslik  
        region_score = 1.0 if tender.region in company.regions else 0.5
        
        # 4. Narx moslik
        amount_score = 0.0
        if company.min_amount <= tender.amount <= company.max_amount:
            amount_score = 1.0
        elif tender.amount < company.min_amount:
            amount_score = 0.3
        
        # Yakuniy hisob
        final = (text_score * 0.60 + cat_score * 0.25 + 
                 region_score * 0.10 + amount_score * 0.05) * 100
        
        return round(final, 2)
    
    def _preprocess(self, text: str) -> str:
        """O'zbek matni tozalash"""
        text = text.lower()
        stop_words = ["va", "yoki", "uchun", "bilan", "da", "ni", "ga"]
        words = [w for w in text.split() if w not in stop_words]
        return " ".join(words)
```

---

### 📅 6-HAFTA: Telegram Bot

```python
# bot/main.py
import asyncio
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.redis import RedisStorage

async def main():
    bot = Bot(token="BOT_TOKEN_DAN_ENV")
    storage = RedisStorage.from_url("redis://redis:6379/1")
    dp = Dispatcher(storage=storage)
    
    # Handlerlarni ulash
    dp.include_router(start_router)
    dp.include_router(tenders_router)
    dp.include_router(profile_router)
    
    await dp.start_polling(bot)

# bot/handlers/start.py
@router.message(CommandStart())
async def start_handler(message: Message, state: FSMContext):
    await message.answer(
        "🎉 TenderIQ ga xush kelibsiz!\n\n"
        "Men sizga mos davlat tenderlarini avtomatik topib beraman.\n\n"
        "Boshlash uchun kompaniyangizni sozlang:",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(text="⚙️ Profilni sozlash", callback_data="setup_profile")
        ]])
    )

# Xabar formati
async def send_tender_notification(bot, user_id, tender, score):
    text = (
        f"🔔 <b>Yangi mos tender!</b>\n\n"
        f"📋 <b>{tender.title}</b>\n"
        f"🏛 {tender.organization}\n"
        f"💰 {format_money(tender.amount)}\n"
        f"📅 {days_left(tender.deadline)} kun qoldi\n"
        f"📊 Moslik: <b>{score:.0f}%</b>\n\n"
        f"📈 So'nggi 12 oyda o'rtacha g'alaba: {format_money(tender.avg_win)}"
    )
    
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton("📊 Raqobatchilar", callback_data=f"comp:{tender.id}"),
            InlineKeyboardButton("💡 Narx tavsiyasi", callback_data=f"pred:{tender.id}"),
        ],
        [InlineKeyboardButton("🔗 To'liq ma'lumot", url=f"https://tenderiq.uz/t/{tender.id}")]
    ])
    
    await bot.send_message(user_id, text, reply_markup=kb, parse_mode="HTML")
```

**✅ 2-OY YAKUNIY NATIJA:**
- 10 kompaniya bot orqali tender xabari olmoqda
- Moslik algoritmi 70%+ aniqlik bilan ishlaydi
- tender.mc.uz scraper qo'shilgan

---

## 4. 3-OY — ML MODELLARI

**Maqsad:** "945M so'mda taklif bersang yutish ehtimoli 71%" — ishlaydi.

---

### 📅 9-HAFTA: Random Forest Narx Modeli

```python
# ml/price_model.py
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import cross_val_score
import pickle

class PricePredictionModel:
    
    FEATURES = ['category_enc', 'region_enc', 'month', 
                'amount_log', 'days_to_deadline', 
                'hist_avg_log', 'avg_participants']
    
    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1  # Barcha CPU core ishlatsin
        )
        self.label_encoders = {}
    
    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        for col in ['category', 'region']:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                df[f'{col}_enc'] = self.label_encoders[col].fit_transform(df[col])
            else:
                df[f'{col}_enc'] = self.label_encoders[col].transform(df[col])
        
        df['amount_log'] = np.log1p(df['amount'])
        df['hist_avg_log'] = np.log1p(df['historical_avg'])
        df['month'] = pd.to_datetime(df['deadline']).dt.month
        
        return df[self.FEATURES]
    
    def train(self, df: pd.DataFrame) -> dict:
        X = self.prepare_features(df.copy())
        y = np.log1p(df['winning_amount'])  # Log transform
        
        # Cross-validation bilan sifat tekshirish
        cv_scores = cross_val_score(self.model, X, y, cv=5, scoring='r2')
        self.model.fit(X, y)
        
        metrics = {
            'r2_mean': cv_scores.mean(),
            'r2_std': cv_scores.std(),
            'samples': len(df)
        }
        
        print(f"Model o'rgatildi: R²={metrics['r2_mean']:.3f} ± {metrics['r2_std']:.3f}")
        
        # Saqlash
        with open('app/ml/models/price_model.pkl', 'wb') as f:
            pickle.dump(self, f)
        
        return metrics
    
    def predict(self, tender_data: dict) -> dict:
        df = pd.DataFrame([tender_data])
        X = self.prepare_features(df)
        
        # Barcha daraxt bashoratlarini olish (noaniqlik uchun)
        tree_preds = [tree.predict(X)[0] for tree in self.model.estimators_]
        
        optimal_bid_log = np.median(tree_preds)
        std_log = np.std(tree_preds)
        
        optimal_bid = int(np.expm1(optimal_bid_log))
        low_bid = int(np.expm1(optimal_bid_log - std_log * 0.5))
        high_bid = int(np.expm1(optimal_bid_log + std_log * 0.5))
        
        win_probability = self._calculate_win_prob(optimal_bid, tender_data)
        
        return {
            "optimal_bid": optimal_bid,
            "bid_range": {"low": low_bid, "high": high_bid},
            "win_probability": round(win_probability, 1),
            "confidence": round(1 - std_log / optimal_bid_log, 2)
        }
    
    def _calculate_win_prob(self, bid: int, tender_data: dict) -> float:
        """Tarixiy ma'lumot asosida yutish ehtimolini hisoblash"""
        historical = get_similar_results(
            tender_data['category'], 
            tender_data['region'],
            months=12
        )
        if not historical:
            return 50.0
        
        wins_below = sum(1 for h in historical if h.winning_amount >= bid)
        return (wins_below / len(historical)) * 100
```

---

### 📅 10-HAFTA: Raqobatchi Tahlili

```python
# services/competitor_service.py

def get_competitor_analysis(tender_id: int) -> dict:
    tender = get_tender(tender_id)
    
    # O'xshash tenderlar natijalarini olish
    results = db.query(TenderResult).join(Tender).filter(
        Tender.category == tender.category,
        Tender.region == tender.region,
        TenderResult.result_date >= date.today() - timedelta(days=365)
    ).all()
    
    # Kompaniyalar bo'yicha statistika
    company_stats = {}
    for result in results:
        name = result.winner_name
        if name not in company_stats:
            company_stats[name] = {
                "wins": 0, "total_amount": 0, "amounts": []
            }
        company_stats[name]["wins"] += 1
        company_stats[name]["total_amount"] += result.winning_amount
        company_stats[name]["amounts"].append(result.winning_amount)
    
    # Tartiblash va statistika
    competitors = []
    for name, stats in company_stats.items():
        competitors.append({
            "name": name,
            "wins_last_12m": stats["wins"],
            "avg_bid": int(stats["total_amount"] / stats["wins"]),
            "min_bid": min(stats["amounts"]),
            "max_bid": max(stats["amounts"]),
            "win_rate": stats["wins"] / len(results) * 100,
            "risk_level": "high" if stats["wins"] / len(results) > 0.5 else "normal"
        })
    
    return sorted(competitors, key=lambda x: x["wins_last_12m"], reverse=True)
```

**✅ 3-OY YAKUNIY NATIJA:**
- Narx bashorati API ishlaydi (R² ≥ 0.70)
- Raqobatchi tahlili API ishlaydi
- WebSocket real-time yangilanish
- 20 beta foydalanuvchi

---

## 5. 4-OY — AI + FRONTEND MVP

**Maqsad:** Web dashboard va AI hujjat tahlili ishga tushadi.

---

### 📅 13-HAFTA: Claude API + PDF Tahlili

```python
# services/document_service.py
import anthropic
import fitz  # PyMuPDF

client = anthropic.Anthropic(api_key="API_KEY")

def extract_pdf_text(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text[:50000]  # Birinchi 50K belgi

def analyze_tender_document(pdf_path: str) -> dict:
    text = extract_pdf_text(pdf_path)
    
    prompt = f"""
    Quyidagi tender hujjatini o'qib, qisqacha tahlil qil:
    
    1. KERAKLI HUJJATLAR: Ishtirok etish uchun kerakli barcha hujjatlar
    2. SERTIFIKATLAR: Talab qilingan sertifikatlar va litsenziyalar
    3. TAJRIBA TALABLARI: Minimal tajriba va o'xshash loyihalar
    4. MOLIYAVIY TALABLAR: Bank kafolati, ustav kapitali, moliyaviy ko'rsatkichlar
    5. MUDDAT: Taklif topshirish muddati
    6. ASOSIY SHARTLAR: Boshqa muhim shartlar
    
    TENDER HUJJATI:
    {text}
    
    Javobni O'zbek tilida, ro'yxat ko'rinishida ber.
    """
    
    response = client.messages.create(
        model="claude-3-haiku-20240307",  # Arzon va tez
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return {
        "checklist": response.content[0].text,
        "analyzed_at": datetime.now().isoformat()
    }
```

---

### 📅 14-HAFTA: Next.js Frontend

```typescript
// app/(dashboard)/dashboard/page.tsx
export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/analytics/dashboard').then(r => r.data)
  });
  
  const { data: tenders } = useQuery({
    queryKey: ['matched-tenders'],
    queryFn: () => api.get('/tenders/matched?limit=5').then(r => r.data)
  });
  
  return (
    <div className="space-y-6">
      {/* Statistika kartalar */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Yangi tenderlar" value={stats?.new_today} icon="🔔" />
        <StatCard title="Kuzatilyapti" value={stats?.watching} icon="👁" />
        <StatCard title="O'rtacha g'alaba" value={`${stats?.avg_win_rate}%`} icon="🏆" />
      </div>
      
      {/* Bugungi mos tenderlar */}
      <TenderList tenders={tenders} />
      
      {/* Narx trendi grafigi */}
      <PriceTrendChart category="construction" />
    </div>
  );
}
```

**✅ 4-OY YAKUNIY NATIJA:**
- Web dashboard ishlaydi
- AI PDF tahlili ishlaydi (Pro feature)
- Rate limiting (Free/Pro/Business)
- Email bildirishnomalar

---

## 6. 5-OY — SAAS + TO'LOV

**Maqsad:** Birinchi to'lovchi mijoz!

---

### 📅 17-HAFTA: Click va Payme Integratsiya

```python
# services/payment_service.py

class ClickPaymentService:
    """
    Click bilan integratsiya:
    1. click.uz → Merchant hisob ochish
    2. Test muhit kalitlari olish
    3. To'lov oynasi URL generatsiya
    4. Webhook orqali tasdiqlash
    """
    
    CLICK_BASE_URL = "https://my.click.uz/services/pay"
    
    def generate_payment_url(self, user_id: int, plan: str, amount: int) -> str:
        params = {
            "service_id": CLICK_SERVICE_ID,
            "merchant_id": CLICK_MERCHANT_ID,
            "amount": amount,
            "transaction_param": f"user_{user_id}_plan_{plan}",
            "return_url": "https://tenderiq.uz/payment/success"
        }
        return f"{self.CLICK_BASE_URL}?" + "&".join(f"{k}={v}" for k, v in params.items())
    
    def handle_webhook(self, data: dict) -> bool:
        """Click to'lovni tasdiqlash"""
        if data['error'] == 0:  # Muvaffaqiyatli to'lov
            user_id, plan = self._parse_transaction(data['merchant_trans_id'])
            activate_subscription(user_id, plan)
            return True
        return False

# Obuna rejalari
PLANS = {
    "free":     {"price": 0,         "daily_limit": 50,   "ml_access": False},
    "pro":      {"price": 299_000,   "daily_limit": 500,  "ml_access": True},
    "business": {"price": 990_000,   "daily_limit": 5000, "ml_access": True, "api_access": True},
}
```

---

### 📅 18-HAFTA: Pricing Sahifasi (Frontend)

```typescript
// app/(public)/pricing/page.tsx
const plans = [
  {
    name: "Free",
    price: "0",
    features: [
      "Kunlik 5 ta tender xabari",
      "Oddiy qidiruv",
      "Telegram bot (cheklangan)"
    ],
    cta: "Boshlash",
    highlighted: false
  },
  {
    name: "Pro",
    price: "299,000",
    period: "so'm/oy",
    features: [
      "Cheksiz tender xabarlari",
      "Narx bashorati (ML)",
      "Raqobatchi tarixi",
      "AI hujjat tahlili",
      "PDF hisobot"
    ],
    cta: "Pro ga o'tish",
    highlighted: true  // Sariq/to'q rang
  },
  {
    name: "Business",
    price: "990,000",
    period: "so'm/oy",
    features: [
      "Pro + hammasi",
      "5 foydalanuvchi",
      "API kirish",
      "Maxsus hisobotlar",
      "Konsultatsiya"
    ],
    cta: "Bog'lanish",
    highlighted: false
  }
];
```

**✅ 5-OY YAKUNIY NATIJA:**
- Click + Payme to'lov ishlaydi
- Admin panel to'liq
- 50+ beta user → kamida 10 tasi Pro ga o'tdi
- Testlar 60%+ coverage

---

## 7. 6-OY — LAUNCH + O'SISH

**Maqsad:** `tenderiq.uz` — internetda ochiq, ~$7,500/oy MRR.

---

### 📅 21-HAFTA: Production Deploy

```bash
# VPS ga ulanish (DigitalOcean/Hetzner)
ssh root@your-server-ip

# Server tayyorlash
apt update && apt upgrade -y
apt install docker.io docker-compose nginx certbot -y

# Loyihani klonlash
git clone https://github.com/sening/tenderiq.git /opt/tenderiq
cd /opt/tenderiq

# .env faylni to'ldirish
cp .env.example .env
nano .env  # Real kalitlarni kiriting

# SSL sertifikat (bepul)
certbot --nginx -d tenderiq.uz -d www.tenderiq.uz

# Ishga tushirish
docker-compose -f docker-compose.prod.yml up -d

# GitHub Actions CI/CD — har push da avtomatik deploy
```

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r requirements.txt && pytest tests/ -v

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: root
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/tenderiq
            git pull origin main
            docker-compose -f docker-compose.prod.yml up -d --build
            docker-compose exec api alembic upgrade head
```

---

### 📅 23-HAFTA: Marketing

```
B2B Outreach kanallari:

1. LinkedIn
   → "O'zbekiston qurilish kompaniyalari" guruhlar
   → Xususiy xabar: "Siz tenderda qatnashasizmi? Bepul sinab ko'ring"

2. Telegram guruhlar
   → Qurilish, IT, logistika, tibbiyot tijorat guruhlari
   → Qisqa demo video + havola

3. Tanishlar orqali
   → Beta foydalanuvchilarni "ikki do'stingizga tavsiya qiling"
   → Referral: +1 oy bepul Pro

4. IT Park orqali (inkubatsiya)
   → Ular sizni kompaniyalarga taqdim etadi
   → Demo kunlari, pitching tadbirlari

5. Case study
   → "Sardor kompaniyasi 945M so'm taklif bilan g'olib bo'ldi"
   → Blog post + Telegram kanalda

Birinchi oyda maqsad: 200 ro'yxat → 30 Pro → ~$750
Ikkinchi oyda: 500 ro'yxat → 80 Pro → ~$2,000
3-4 oy: 1500 ro'yxat → 200 Pro + 30 Business → ~$7,500
```

**✅ 6-OY YAKUNIY NATIJA:**
- tenderiq.uz ishlamoqda
- CI/CD — har push deploy bo'ladi
- Monitoring (Prometheus + Grafana + Sentry)
- ~$7,500/oy MRR maqsad

---

## 8. HAR KUNI NIMA QILISH KERAK

### Ertalab (09:00)
```
□ Kecha yozilgan kodga review
□ GitHub Issues dan bugungi vazifani olish
□ Scraper ishlayaptimi? → Grafana tekshirish
□ Bot da xatolar bormi? → Sentry tekshirish
```

### Asosiy ish (09:00-17:00)
```
□ Haftaning asosiy feature ini yozish
□ Har 2 soatda bir marta git commit
□ Yangi feature → avval test, keyin implement
□ Muammo bo'lsa → 30 daqiqa ko'rasan, topilmasa — StackOverflow/ChatGPT
```

### Kechqurun (17:00-19:00)
```
□ Bugungi kodni review va commit
□ Pull Request → dev branch ga
□ Trello/Notion da bugungi vazifani yopish
□ Ertangi reja
□ 30 daqiqa o'rganish (doc yoki video)
```

### Hafta oxiri (shanba-yakshanba)
```
Shanba: Haftaning barcha kodini review, bug fix
Yakshanba: Dam olish yoki 2-3 soat o'rganish
```

---

## 9. TEXNOLOGIYALAR — O'RGANISH TARTIBI

```
1-oy — O'rgan:          Nima uchun:
─────────────────────────────────────────────────
FastAPI                 Barcha API shu orqali
SQLAlchemy + Alembic    DB bilan ishlash
Pydantic v2             Ma'lumot validatsiyasi
JWT + bcrypt            Xavfsizlik
Playwright              Scraping
Docker + docker-compose Muhit

2-oy — O'rgan:
─────────────────────────────────────────────────
Celery + Redis          Fon vazifalar
Aiogram 3.x             Telegram bot
Scikit-learn asoslari   ML boshlanish

3-oy — O'rgan:
─────────────────────────────────────────────────
Random Forest           Narx bashorati
TF-IDF + Cosine         Matn moslik
TimescaleDB             Vaqt seriyali ma'lumot
WebSocket               Real-time

4-oy — O'rgan:
─────────────────────────────────────────────────
Anthropic SDK           Claude API
PyMuPDF                 PDF o'qish
Next.js 14              Frontend
TypeScript              Tip xavfsizligi
TanStack Query          Server state
Recharts                Grafiklar

5-oy — O'rgan:
─────────────────────────────────────────────────
Click API               O'zbek to'lov tizimi
Payme API               O'zbek to'lov tizimi
ReportLab               PDF generatsiya

6-oy — O'rgan:
─────────────────────────────────────────────────
Nginx                   Web server
GitHub Actions          CI/CD
Prometheus + Grafana    Monitoring
Sentry                  Xato kuzatish
```

### Foydali resurslar
```
FastAPI         → fastapi.tiangolo.com (eng yaxshi doc)
Aiogram         → docs.aiogram.dev
Scikit-learn    → scikit-learn.org/stable/user_guide.html
Next.js         → nextjs.org/docs
Playwright      → playwright.dev/python/docs/intro
Docker          → docs.docker.com/get-started
Celery          → docs.celeryq.dev
Click API       → docs.click.uz (o'zbek tilida bor)
Payme API       → developer.payme.uz
```

---

## 10. OLTIN QOIDALAR

### Texnik qoidalar

**1. Har kuni commit qil**
```bash
# Har kuni kamida bitta commit bo'lsin
git add .
git commit -m "feat: uzex scraper pagination qo'shildi"
git push origin dev
```

**2. .env faylni hech qachon GitHub ga push qilma**
```bash
# .gitignore da bo'lsin:
.env
*.pkl       # ML modellar
__pycache__/
node_modules/
```

**3. Har feature uchun alohida branch**
```bash
git checkout -b feature/price-prediction
# ... kod yozish ...
git push origin feature/price-prediction
# GitHub da Pull Request ochish → dev ga merge
```

**4. Har hafta deploy qil**
```
Ssenday buni qilma: "Tayyor bo'lgandan keyin deploy qilaman"
Bu yo'l qilish kerak: Har juma yangi version server da
```

**5. Testlarni unutma**
```python
# Har yangi service uchun kamida 3 ta test:
def test_matching_high_score():      # Mos kelganda 80%+
def test_matching_low_score():       # Mos kelmaganda 30%-
def test_matching_category_weight(): # Kategoriya 25% og'irlik
```

### Biznes qoidalar

**6. Erta foydalanuvchi top**
```
2-oyda allaqachon 10 kompaniya ishlat
Ularning fikrini har hafta so'ra
"Sizga nima kerak?" — doim so'roq
```

**7. Pul olishni kechiktirma**
```
3-oy = birinchi pullik mijoz
Agar 3-oydа pul bo'lmasa — narxingni tushur
Agar hali ham bo'lmasa — muammoni qayta ko'r
```

**8. Raqiblarni kuzat**
```
Har oy tekshir:
- Xorijda (Eu, US) xuddi shu loyiha bormi?
- Ular nima yaxshi qilmoqda?
- Sening ustunliging nima?
```

**9. Sog'lig'ingni saqlang**
```
- 7-8 soat uxla
- Juma kechqurun dam ol
- Sport/yurish har kuni
- Charchagan kodchi = xatolar ko'p
```

**10. IT Park inkubatsiyasidan to'liq foydalanish**
```
□ Har mentorlik sessiyasiga tay yorlanib bor
□ Savollaringni oldindan yozib ol
□ Investor uchrashuvini ko'p emas, sifatli qil
□ Boshqa startaplardan o'rgan
```

---

## YAKUNIY MO'LJAL

```
6 OY OXIRIDA:

✅ tenderiq.uz — 24/7 ishlaydi
✅ 45,000+ tender bazada
✅ ML model R² ≥ 0.75
✅ 200+ Pro foydalanuvchi
✅ ~$7,500/oy MRR
✅ 0 (nol) raqobatchi (O'zbekistonda)
✅ Qozog'iston kengaytirish rejalashtirilgan
✅ Investor taqdimoti tayyor

Bu loyiha — 3 yil davomida himoyalangan, chunki:
1. Ma'lumot to'planishi (competitor 2 yil kechikadi)
2. ML model o'rganishi (har oy aniqroq)
3. Ko'p manbali integratsiya (takrorlash qiyin)
4. Foydalanuvchi odati (o'zgartirish qiyin)
```

---

*Hujjat: TenderIQ Yo'l Xaritasi v1.0*
*Yangilanish: Har sprint oxirida*
