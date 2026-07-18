# TenderIQ User Frontend UI Redesign Plan

## Maqsad
Sidebar-based layoutni Apple.com uslubidagi top navbar + glassmorphism dizaynga o'zgartirish.
Mockup: `/Users/Developer/DRF/TenderIQ/design-mockup.html` — tasdiqlangan dizayn.

## Muhim qoidalar
- Barcha mavjud funksionallik saqlanishi SHART
- Scraper tasklarni HECH QACHON yoqmaslik
- Faqat so'ralgan o'zgarishlarni qilish
- Next.js 16 — `node_modules/next/dist/docs/` dagi hujjatlarni o'qib ishlash

---

## 1-BOSQICH: Navbar komponenti (ENG QIYIN)

### Nima qilinadi:
Sidebar (`sidebar-nav.tsx`) o'rniga Apple-style top navbar yaratiladi.

### Yaratiladigan fayl:
`src/components/layout/top-navbar.tsx`

### Navbar tuzilishi:
```
[TQ Logo] — [Pill container: Asosiy | Tahlil | Ma'lumotlar | Jamoa | Yordam | Sozlamalar] — [Search | Bell | Avatar]
```

### Nav guruhlar va linklar (sidebar-nav.tsx dan aynan ko'chiriladi):

**Asosiy:**
- /dashboard — Bosh sahifa (LayoutDashboard)
- /tenders — Tenderlar (FileSearch)
- /matched — Mos tenderlar (Target)
- /recommendations — AI tavsiyalar (Sparkles)
- /pipeline — Pipeline (Kanban)

**Tahlil:**
- /ml — AI bashorat (Brain)
- /analytics — Analitika (BarChart3)
- /reports — Hisobotlar (FileDown)
- /competitors — Raqobatchilar (Users)
- /ratings — Reytinglar (Star)
- /pricing — Narx strategiya (TrendingDown)

**Ma'lumotlar:**
- /calendar — Kalendar (CalendarDays)
- /compare — Taqqoslash (Columns3)
- /map — Xarita (Map)
- /purchase-plans — Xarid-reja (ClipboardList)
- /contracts — Shartnomalar (FileSignature)
- /documents — Hujjatlar (FileText)

**Jamoa:**
- /company — Kompaniya (Building2)
- /teams — Jamoa (UsersRound)
- /journal — Win/Loss (BookOpen)
- /budget — Kalkulyator (Calculator)

**Yordam:**
- /news — Yangiliklar (Newspaper)
- /knowledge-base — Bilimlar bazasi (GraduationCap)
- /faq — FAQ (HelpCircle)
- /support — Texnik yordam (Headphones)
- /guide — Qo'llanma (ShieldCheck)
- /contact — Aloqa (Phone)

**Sozlamalar (Hisob guruhidan birlashtiriladi):**
- /notifications — Bildirishnomalar (Bell)
- /payments — To'lovlar (Wallet)
- /subscription — Obuna (CreditCard)
- /settings — Sozlamalar (Settings)

### CSS xususiyatlari:
- Navbar: `h-16`, glassmorphism (`bg-white/85 backdrop-blur-2xl`), `sticky top-0 z-50`
- Pill container: `bg-black/[0.04] border border-black/[0.08] rounded-full p-[5px]`
- Pill tugmalar: `h-11 px-6 text-[15px] font-medium rounded-full`
- Hover: `text-blue-600 bg-white/80 shadow-sm`
- Dropdown: `bg-[rgba(245,245,247,0.95)] backdrop-blur-[80px] rounded-2xl shadow-xl`
- Dropdown linklar: `text-base font-medium rounded-full px-[18px] py-2.5`
- Hover link: `text-blue-600 bg-blue-600/[0.06]`
- Dropdown ustun sarlavha: `text-xs font-bold uppercase tracking-wider text-muted-foreground`
- Backdrop overlay: `fixed inset-0 bg-white/40 backdrop-blur-md` (JS bilan toggle)
- Invisible bridge: `::after` pseudo-element tugma va dropdown orasida

### O'ng tomon elementlar:
- Search icon button (mavjud qidirish logikasi saqlanadi)
- Theme toggle (mavjud: Sun/Moon/Monitor)
- Bell + unread badge (mavjud: useNotificationStore)
- Avatar dropdown (mavjud: user info + logout)

### Import qilinadigan hooklar:
- `usePathname()` — aktiv sahifani aniqlash
- `useAuthStore` — user, logout
- `useNotificationStore` — unreadCount
- `useTheme` — theme toggle
- `useRouter` — search navigation

---

## 2-BOSQICH: Dashboard layout o'zgartirish

### O'zgartiriladi:
`src/app/(dashboard)/layout.tsx`

### Hozirgi holat:
```tsx
<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    <Header />
    <main>{children}</main>
  </SidebarInset>
</SidebarProvider>
```

### Yangi holat:
```tsx
<>
  <TopNavbar />
  <main className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6">{children}</main>
</>
```

### O'chiriladigan importlar:
- SidebarProvider, SidebarInset — kerak emas
- AppSidebar — kerak emas
- Header — kerak emas (navbar ichiga ko'chadi)

### Saqlanadigan logika:
- Auth tekshirish (useAuthStore — init, isAuthenticated, loadUser)
- Theme qo'llash (useTheme, user.theme)
- useNotificationWS() hook
- router.push("/login") redirect

---

## 3-BOSQICH: globals.css yangilash

### O'zgartiriladi:
`src/app/globals.css`

### Qo'shiladigan stillar:
```css
/* Apple-style glassmorphism utilities */
/* Navbar backdrop */
/* Dropdown animations */
/* Orqa fon gradient bloblar (landing page uchun) */
```

### O'chiriladigan stillar:
- Sidebar bilan bog'liq custom CSS (agar bor bo'lsa)

---

## 4-BOSQICH: Landing page (`src/app/page.tsx`)

### Mockupdan olinadigan dizayn:
- Hero section: 72px sarlavha, gradient text, pill badge
- Stats bar: glassmorphism, gradient raqamlar
- Features grid: 3 ustun, glass kartalar, hover animatsiya
- "Qanday ishlaydi" roadmap: scroll-driven, interaktiv 4 bosqich
- CTA section: glass karta, "Obuna rejalari bilan tanishing"
- Footer: qora fon

### Landing page navbar:
Alohida — pill-shaped linklar (Imkoniyatlar, Qanday ishlaydi, Narxlar) + Kirish/Boshlash tugmalari

---

## 5-BOSQICH: Login/Register sahifalar

### Fayllar:
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/(auth)/verify-email/page.tsx`

### Dizayn:
- Split layout: chap — gradient panel (ma'lumotlar), o'ng — forma
- Glassmorphism input fieldlar
- Mavjud auth logika to'liq saqlanadi

---

## 6-BOSQICH: Dashboard sahifalar

### Barcha sahifalar ro'yxati (32 ta):
```
/dashboard, /tenders, /tenders/[id], /matched, /recommendations,
/pipeline, /ml, /analytics, /reports, /competitors, /ratings,
/pricing, /calendar, /compare, /map, /purchase-plans, /contracts,
/documents, /company, /teams, /journal, /budget, /news,
/knowledge-base, /faq, /support, /guide, /contact, /notifications,
/payments, /subscription, /settings
```

### Har bir sahifada:
- Sidebar-ga bog'liq elementlar olib tashlanadi
- Kartalar glassmorphism (`bg-white/45 backdrop-blur-xl border-white/50`)
- Kattaroq shriftlar va paddinglar
- Mavjud API chaqiruvlar va logika 100% saqlanadi

---

## O'chiriladigan fayllar (oxirida):
- `src/components/layout/sidebar-nav.tsx` — navbar bilan almashtiriladi
- `src/components/layout/header.tsx` — navbar ichiga qo'shiladi
- `src/components/ui/sidebar.tsx` — kerak emas (agar boshqa joyda ishlatilmasa tekshirish)

## O'chirilMAYDIGAN fayllar:
- Barcha `src/app/(dashboard)/*/page.tsx` — faqat dizayn yangilanadi
- Barcha `src/store/*`, `src/hooks/*`, `src/lib/*` — o'zgartirilmaydi
- Barcha `src/components/ui/*` (sidebar.tsx dan tashqari) — saqlanadi

---

## Texnik eslatmalar:
- Next.js 16 — `"use client"` direktivasi kerak bo'lgan joylarda
- React 19 — yangi API lar, `use()` hook
- Tailwind CSS v4 — `@theme`, `@custom-variant` sintaksisi
- shadcn/ui komponentlari saqlanadi (Button, Card, Input, Dialog, etc.)
- Geist + Geist Mono shriftlari saqlanadi
- next-themes saqlanadi
- Zustand store'lar o'zgartirilmaydi
- API layer (`src/lib/api.ts`) o'zgartirilmaydi
