# TenderIQ — Kelgusi rejalar

> Platformani production-ready holatga keltirish uchun qilinishi kerak bo'lgan ishlar
> Yaratilgan: 2026-yil 14-iyun

---

## Ustuvorlik darajalari

- P0 — Kritik (ishga tushirish uchun shart)
- P1 — Muhim (birinchi foydalanuvchilar uchun kerak)
- P2 — O'rtacha (platforma sifatini oshiradi)
- P3 — Past (keyingi bosqichda)

---

## 1. Backend ishlar

### P0 — Kritik

- [ ] **Alembic migratsiyalarni sozlash** — Hozir `create_all()` ishlatilgan, production uchun alembic migratsiya kerak
- [ ] **To'lov tizimini ulash** — Click.uz va Payme uchun haqiqiy merchant credentials olish va integratsiyani tugatish
- [ ] **SECRET_KEY va JWT_SECRET_KEY o'zgartirish** — `.env` dagi placeholder kalitlarni kuchli random kalitlarga almashtirish
- [ ] **Scraper'larni sinab ko'rish** — `mygov_scraper`, `uzex_scraper`, `mc_scraper` haqiqiy saytlarda ishlashini tekshirish, CAPTCHAlar va sayt strukturasi o'zgarishlarini ko'rib chiqish
- [ ] **HTTPS sozlash** — Production uchun SSL sertifikat (Let's Encrypt + Nginx reverse proxy)

### P1 — Muhim

- [ ] **Unit va integration testlar** — `pytest` + `pytest-asyncio` bilan API endpointlar, servislar, ML modullarga testlar yozish
- [ ] **Email tasdiqlash** — Registratsiyadan keyin email verifikatsiya (SMTP sozlash)
- [ ] **Parolni tiklash** — "Parolni unutdim" endpoint va email yuborish
- [ ] **Anthropic API kalitini ulash** — Claude AI orqali tender tahlili va tavsiyalar
- [ ] **ML modellarni o'qitish** — Haqiqiy tender ma'lumotlari bilan matching, price, anomaly modellarni train qilish
- [ ] **WebSocket real-time bildirishnomalar** — Yangi tender kelib tushganda foydalanuvchiga xabar berish
- [ ] **Rate limiter'ni takomillashtirish** — Foydalanuvchi obuna rejasiga qarab limit o'rnatish (hozir hammaga FREE limit)
- [ ] **Logging va monitoring** — Prometheus metrics endpointini ulash, Grafana dashboard sozlash

### P2 — O'rtacha

- [ ] **Pagination optimallashtirish** — Cursor-based pagination (offset-based o'rniga)
- [ ] **Full-text search** — PostgreSQL `tsvector` yoki Elasticsearch qo'shish
- [ ] **File upload** — Kompaniya hujjatlari (litsenziya, guvohnoma) yuklash
- [ ] **Audit log** — Admin panelda barcha harakatlarni kuzatish
- [ ] **API versioning** — v2 uchun tayyorgarlik
- [ ] **Background job monitoring** — Flower UI ni himoyalash (login kerak)
- [ ] **Database backup** — Avtomatik kunlik backup (pg_dump + S3/MinIO)

### P3 — Keyingi bosqich

- [ ] **Multi-tenancy** — Bir nechta tashkilot uchun izolyatsiya
- [ ] **Webhook tizimi** — Tashqi tizimlarga eventlar yuborish
- [ ] **API rate limit per endpoint** — Endpoint bo'yicha alohida limitlar
- [ ] **Caching strategiya** — Redis cache invalidation yaxshilash

---

## 2. Frontend ishlar

### P0 — Kritik

- [ ] **Loading va error holatlar** — Barcha sahifalarda to'liq loading skeleton va error boundary qo'shish
- [ ] **Responsive dizayn** — Mobil qurilmalarda to'liq ishlashini tekshirish va tuzatish
- [ ] **Token muddati tugashi** — Access token tugaganda foydalanuvchiga xabar berish

### P1 — Muhim

- [ ] **Dark mode** — Tailwind dark mode qo'shish (toggle button)
- [ ] **Til o'zgartirish** — O'zbek/Rus/Ingliz tillarini qo'llab-quvvatlash (i18n)
- [ ] **Dashboard diagrammalar** — Recharts bilan bozor trendi, haftalik/oylik statistika grafiklari
- [ ] **Tender qidiruvni takomillashtirish** — Debounce bilan real-time qidiruv, header'dagi search ishlashi
- [ ] **Saved tenders sahifasi** — Saqlangan tenderlar ro'yxati
- [ ] **Notifications sahifasi** — Bildirishnomalar ro'yxati va o'qilgan/o'qilmagan holati
- [ ] **Company stats sahifasi** — Kompaniya statistikasi (nechta tender matched, win rate)
- [ ] **Form validatsiya** — Zod + react-hook-form bilan to'liq client-side validatsiya
- [ ] **Obuna to'lov oqimi** — Click/Payme to'lov sahifasiga redirect va callback

### P2 — O'rtacha

- [ ] **Admin panel** — Foydalanuvchilar, tenderlar, to'lovlarni boshqarish
- [ ] **Tender taqqoslash** — Bir nechta tenderni yonma-yon solishtirish
- [ ] **PDF export** — Tender hisobotini PDF sifatida yuklab olish
- [ ] **Real-time yangilanishlar** — WebSocket orqali yangi tenderlar ko'rinishi
- [ ] **Profil rasmi** — Avatar yuklash
- [ ] **Keyboard shortcuts** — Tez navigatsiya uchun klaviatura shortcutlari
- [ ] **Infinite scroll** — Tenderlar ro'yxatida pagination o'rniga infinite scroll
- [ ] **PWA qo'llab-quvvatlash** — Service worker, offline rejim, push notifications

### P3 — Keyingi bosqich

- [ ] **Landing page** — Marketing sahifasi (xususiyatlar, narxlar, FAQ)
- [ ] **Blog** — MDX bilan tender sohasidagi maqolalar
- [ ] **Onboarding wizard** — Yangi foydalanuvchilar uchun bosqichma-bosqich sozlash
- [ ] **Analytics export** — CSV/Excel formatda ma'lumotlarni yuklab olish
- [ ] **Tender calendar** — Kalendarli ko'rinish (muddatlar bilan)

---

## 3. Telegram Bot ishlar

### P1 — Muhim

- [ ] **Inline qidiruv** — `@TendersIQbot tender nomi` bilan to'g'ridan-to'g'ri qidirish
- [ ] **Bildirishnoma sozlamalari** — Foydalanuvchi qaysi kategoriya/viloyat uchun xabar olishni tanlashi
- [ ] **Kunlik digest** — Har kuni ertalab yangi tenderlar haqida xulosa
- [ ] **To'lov bot orqali** — Click/Payme to'lovini bot ichida boshlash

### P2 — O'rtacha

- [ ] **Tender hujjatini yuborish** — PDF faylni botga yuborib AI tahlil olish
- [ ] **Webhook rejim** — Production uchun polling o'rniga webhook
- [ ] **Bot statistikasi** — Nechta foydalanuvchi, nechta so'rov, eng mashhur buyruqlar

---

## 4. DevOps va Deployment

### P0 — Kritik

- [ ] **Production server** — VPS yoki cloud server (DigitalOcean/AWS/Timeweb) olish
- [ ] **Domen va SSL** — `tenderiq.uz` domeni va Let's Encrypt SSL
- [ ] **Nginx reverse proxy** — API va frontend uchun Nginx konfiguratsiya
- [ ] **Environment o'zgaruvchilar** — Production `.env` faylini xavfsiz boshqarish (Docker secrets yoki Vault)

### P1 — Muhim

- [ ] **CI/CD pipeline** — GitHub Actions bilan avtomatik test va deploy
- [ ] **Docker production config** — Multi-stage build optimallashtirish, health checklar
- [ ] **Monitoring** — Prometheus + Grafana + alerting
- [ ] **Log aggregation** — Centralized logging (ELK yoki Loki)
- [ ] **Database migratsiya strategiya** — Zero-downtime deploy uchun

### P2 — O'rtacha

- [ ] **Auto-scaling** — Load balancer + bir nechta API instance
- [ ] **CDN** — Statik fayllar uchun CDN (CloudFlare)
- [ ] **Staging muhit** — Production'dan oldin test server
- [ ] **Backup va disaster recovery** — Avtomatik backup + recovery plani

---

## 5. Biznes va Huquqiy

### P0 — Kritik

- [ ] **Click.uz merchant akkaunt** — Haqiqiy to'lov qabul qilish uchun ariza
- [ ] **Payme merchant akkaunt** — Haqiqiy to'lov qabul qilish uchun ariza
- [ ] **Foydalanish shartlari** — Terms of Service sahifasi
- [ ] **Maxfiylik siyosati** — Privacy Policy sahifasi

### P1 — Muhim

- [ ] **Shaxsiy ma'lumotlarni himoyalash** — O'zbekiston qonunchiligi bo'yicha
- [ ] **Soliq hisoboti** — To'lovlar bo'yicha hisobot tizimi

---

## Tavsiya etiladigan ish tartibi

```
1-bosqich (1-2 hafta): P0 ishlar
   ├── Alembic migratsiya
   ├── Secret keylarni o'zgartirish
   ├── Scraper'larni sinash
   ├── Frontend responsive tuzatish
   └── Production server olish

2-bosqich (2-3 hafta): P1 ishlar
   ├── To'lov tizimini ulash (Click/Payme)
   ├── Testlar yozish
   ├── Email verifikatsiya
   ├── Dark mode + i18n
   └── CI/CD pipeline

3-bosqich (3-4 hafta): P2 ishlar
   ├── Admin panel
   ├── Full-text search
   ├── WebSocket real-time
   ├── ML modellarni o'qitish
   └── Monitoring sozlash

4-bosqich (davomiy): P3 ishlar
   ├── Landing page
   ├── PWA
   ├── Advanced analytics
   └── Scaling
```
