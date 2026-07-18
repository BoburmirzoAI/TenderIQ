"use client";

import { useState } from "react";
import {
  BookOpen, Search, FileText, Bell, Star, Brain,
  ClipboardList, Users, Settings,
  ChevronRight, ChevronDown,
} from "lucide-react";

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  badge?: string;
  steps: { title: string; description: string }[];
}

const sections: GuideSection[] = [
  {
    id: "start",
    title: "Boshlash",
    icon: <BookOpen className="h-5 w-5" />,
    badge: "Yangi",
    steps: [
      { title: "Ro'yxatdan o'tish", description: "Email va parol orqali hisob yarating. Telegram orqali ham kirish mumkin." },
      { title: "Kompaniya profili", description: "Kompaniya nomi, STIR, faoliyat yo'nalishlari va hududni to'ldiring. Bu AI tavsiyalar uchun muhim." },
      { title: "Obuna tanlash", description: "Free, Pro yoki Enterprise tariflardan birini tanlang. Free rejada kuniga 10 ta qidiruv." },
    ],
  },
  {
    id: "tenders",
    title: "Tenderlar bilan ishlash",
    icon: <Search className="h-5 w-5" />,
    steps: [
      { title: "Tender qidirish", description: "Kalit so'z, kategoriya, hudud, summa diapazoni va muddat bo'yicha filtrlang." },
      { title: "Tender saqlash", description: "Qiziqarli tenderlarni yulduzcha bosib saqlang. Saqlangan tenderlar alohida ro'yxatda." },
      { title: "Tender taqqoslash", description: "Bir nechta tenderni tanlang va narx, muddat, shartlarini yonma-yon solishtiring." },
      { title: "Hujjatlar yuklab olish", description: "Tender hujjatlarini PDF, DOCX formatda yuklab oling. Hujjatlarga izoh qoldirish ham mumkin." },
    ],
  },
  {
    id: "ai",
    title: "AI tavsiyalar",
    icon: <Brain className="h-5 w-5" />,
    badge: "AI",
    steps: [
      { title: "Qanday ishlaydi", description: "AI sizning oxirgi 10 ta harakatingizni (ko'rish, saqlash, ariza) tahlil qilib, mos tenderlarni taklif qiladi." },
      { title: "Taqsimot", description: "75% asosiy soha, 15% ikkilamchi qiziqishlar, 10% yangi imkoniyatlar — AI avtomatik moslaydi." },
      { title: "Aniqlikni oshirish", description: "Ko'proq tenderlarni ko'ring, saqlang va ariza topshiring — AI sizni yaxshiroq tushunadi." },
    ],
  },
  {
    id: "ratings",
    title: "Kompaniya reytingi",
    icon: <Star className="h-5 w-5" />,
    steps: [
      { title: "Reyting tizimi", description: "Kompaniyalar A dan D gacha baholanadi: g'alabalar soni, shartnoma summasi va faollik asosida." },
      { title: "Kategoriya bo'yicha", description: "Har bir sohada alohida reyting. Qurilish, IT, tibbiyot va boshqa sohalarda eng yaxshilarni ko'ring." },
      { title: "Raqobatchilar", description: "Raqobatchilaringizni kuzating — ularning g'alaba/mag'lubiyat nisbatini tahlil qiling." },
    ],
  },
  {
    id: "plans",
    title: "Xarid-reja va shartnomalar",
    icon: <ClipboardList className="h-5 w-5" />,
    steps: [
      { title: "Xarid-rejalar", description: "Rasmiy e'lon qilinishidan oldin rejalashtirilgan tenderlarni ko'ring. Oldindan tayyorgarlik ko'ring." },
      { title: "Shartnomalar reestri", description: "Tuzilgan shartnomalarni ko'ring — buyurtmachi, ta'minotchi, summa va holat bo'yicha." },
    ],
  },
  {
    id: "documents",
    title: "Hujjatlar",
    icon: <FileText className="h-5 w-5" />,
    steps: [
      { title: "Hujjat yuklash", description: "Tender hujjatlarini tizimga yuklang. PDF, DOCX, XLSX formatlari qo'llab-quvvatlanadi." },
      { title: "Izohlar", description: "Hujjatlarga izoh qoldiring va jamoangiz bilan muhokama qiling. Javob berish ham mumkin." },
    ],
  },
  {
    id: "notifications",
    title: "Bildirishnomalar",
    icon: <Bell className="h-5 w-5" />,
    steps: [
      { title: "Ogohlantirish sozlamalari", description: "Yangi tender, mos tender, muddat yaqinlashishi haqida xabar oling." },
      { title: "Kanallar", description: "Email va Telegram orqali bildirishnoma olishni yoqing yoki o'chiring." },
      { title: "Saqlangan qidiruvlar", description: "Qidiruv shartlarini saqlang — yangi mos tenderlar paydo bo'lganda avtomatik xabar olasiz." },
    ],
  },
  {
    id: "team",
    title: "Jamoa",
    icon: <Users className="h-5 w-5" />,
    steps: [
      { title: "A'zolar qo'shish", description: "Jamoangizga yangi a'zolar taklif qiling. Har biriga alohida rol va ruxsat bering." },
      { title: "Rollar", description: "Admin, Manager, Viewer rollari mavjud. Har bir rol uchun ruxsatlar sozlanadi." },
    ],
  },
  {
    id: "settings",
    title: "Sozlamalar",
    icon: <Settings className="h-5 w-5" />,
    steps: [
      { title: "Profil", description: "Ism, email, telefon va parolni o'zgartiring." },
      { title: "API kaliti", description: "Tashqi tizimlar bilan integratsiya uchun API kalitingizni yarating." },
      { title: "Til va mavzu", description: "Interfeys tilini va qorong'u/yorug' mavzuni tanlang." },
    ],
  },
];

export default function GuidePage() {
  const [openSection, setOpenSection] = useState<string>("start");
  const [search, setSearch] = useState("");

  const filtered = search
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.steps.some(
            (st) =>
              st.title.toLowerCase().includes(search.toLowerCase()) ||
              st.description.toLowerCase().includes(search.toLowerCase())
          )
      )
    : sections;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Foydalanuvchi qo&apos;llanmasi</h1>
        <p className="text-sm text-muted-foreground mt-1">TenderIQ platformasidan samarali foydalanish bo&apos;yicha to&apos;liq yo&apos;riqnoma</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-full h-11 rounded-xl border border-black/10 bg-white/80 pl-10 pr-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
          placeholder="Qo'llanma bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="space-y-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setOpenSection(s.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                openSection === s.id
                  ? "bg-sky-50 text-sky-600 border border-sky-200"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              {s.icon}
              <span className="flex-1">{s.title}</span>
              {s.badge && <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 text-[12px] font-semibold text-[10px] px-1.5 py-0">{s.badge}</span>}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {filtered.map((section) => (
            <div key={section.id} className={"rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg " + (openSection === section.id ? "" : "hidden lg:block")}>
              <div
                className="cursor-pointer"
                onClick={() => setOpenSection(openSection === section.id ? "" : section.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                      {section.icon}
                    </div>
                    <h3 className="text-[16px] font-bold mb-1 text-base">{section.title}</h3>
                    {section.badge && <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 text-[12px] font-semibold">{section.badge}</span>}
                  </div>
                  {openSection === section.id ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              {openSection === section.id && (
                <div className="mt-4">
                  <div className="space-y-4">
                    {section.steps.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium">{step.title}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
