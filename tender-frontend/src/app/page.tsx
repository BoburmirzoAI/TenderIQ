"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Building2,
  FileSearch,
  Globe,
  Map,
  Shield,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
  CheckCircle2,
  Headphones,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FileSearch,
    title: "Barcha tenderlar bir joyda",
    desc: "UzEx, mc.uz va boshqa manbalardagi tenderlarni avtomatik yig'ib, qulay formatda ko'rsatamiz.",
  },
  {
    icon: Brain,
    title: "AI bashorat tizimi",
    desc: "Sun'iy intellekt yordamida optimal narx, g'alaba ehtimoli va risk darajasini bashorat qiling.",
  },
  {
    icon: Target,
    title: "Smart matching",
    desc: "Kompaniyangiz profiliga mos tenderlarni avtomatik topib, sizga taklif qilamiz.",
  },
  {
    icon: Map,
    title: "Interaktiv xarita",
    desc: "O'zbekiston bo'ylab barcha tenderlarni hududlar kesimida xaritada ko'ring.",
  },
  {
    icon: BarChart3,
    title: "Chuqur analitika",
    desc: "Bozor tendensiyalari, narx dinamikasi va raqobatchilar tahlili bir platformada.",
  },
  {
    icon: Shield,
    title: "Xavfsiz platforma",
    desc: "Ma'lumotlaringiz shifrlangan holda saqlanadi. Enterprise darajadagi xavfsizlik.",
  },
];

const stats = [
  { value: "10,000+", label: "Faol tenderlar" },
  { value: "500+", label: "Kompaniyalar" },
  { value: "14", label: "Viloyat" },
  { value: "99.9%", label: "Uptime" },
];

const steps = [
  { step: "01", title: "Ro'yxatdan o'ting", desc: "Kompaniyangiz ma'lumotlarini kiriting va sohangizni tanlang." },
  { step: "02", title: "Tenderlarni toping", desc: "AI sizga mos tenderlarni avtomatik taklif qiladi." },
  { step: "03", title: "Taklifingizni bering", desc: "Optimal narxni AI yordamida aniqlang va ariza bering." },
  { step: "04", title: "G'olib bo'ling", desc: "Natijalarni kuzatib boring va keyingi tenderga tayyorlaning." },
];

const plans = [
  {
    name: "Starter",
    price: "Bepul",
    features: ["Tenderlarni ko'rish", "Asosiy qidirish", "5 ta saqlash", "Email bildirishnoma"],
  },
  {
    name: "Professional",
    price: "299,000 UZS/oy",
    popular: true,
    features: ["Cheksiz saqlash", "AI bashorat", "Smart matching", "Telegram bot", "Analitika", "API kirish"],
  },
  {
    name: "Enterprise",
    price: "Kelishiladi",
    features: ["Hammasi Pro'da", "Jamoa boshqaruvi", "Maxsus integratsiya", "Shaxsiy menejer", "SLA kafolat"],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white font-bold text-sm">
              TQ
            </div>
            <span className="text-xl font-bold text-slate-900">TenderIQ</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Imkoniyatlar</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Qanday ishlaydi</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Narxlar</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Kirish</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Ro'yxatdan o'tish</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 mb-6">
            <Zap className="h-4 w-4" />
            AI-powered tender platformasi
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Davlat tenderlarini<br />
            <span className="text-blue-700">aqlli tarzda</span> yuting
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed">
            TenderIQ — O'zbekistondagi barcha davlat tenderlarini bir joyda ko'ring,
            sun'iy intellekt yordamida tahlil qiling va g'olib bo'ling.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-base">
                Bepul boshlash
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                Batafsil
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-slate-900">{s.value}</p>
                <p className="mt-1 text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Platforma imkoniyatlari</h2>
            <p className="mt-4 text-lg text-slate-600">Tender jarayonini boshidan oxirigacha boshqaring</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Bu qanday ishlaydi?</h2>
            <p className="mt-4 text-lg text-slate-600">4 oddiy qadamda boshlang</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white text-lg font-bold">
                  {s.step}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Obuna rejalari</h2>
            <p className="mt-4 text-lg text-slate-600">O'zingizga mos rejani tanlang</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 ${
                  plan.popular
                    ? "border-blue-700 bg-blue-700 text-white shadow-xl shadow-blue-700/20 scale-105"
                    : "border-slate-200 bg-white"
                }`}
              >
                {plan.popular && (
                  <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold mb-4">
                    Eng ommabop
                  </span>
                )}
                <h3 className={`text-xl font-bold ${plan.popular ? "text-white" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                <p className={`mt-2 text-2xl font-bold ${plan.popular ? "text-white" : "text-slate-900"}`}>
                  {plan.price}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${plan.popular ? "text-blue-200" : "text-blue-600"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="mt-8 block">
                  <Button
                    className={`w-full ${plan.popular ? "bg-white text-blue-700 hover:bg-blue-50" : ""}`}
                    variant={plan.popular ? "secondary" : "default"}
                  >
                    Boshlash
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-700 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Tenderlarni yutishni bugundan boshlang
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            1000+ kompaniya allaqachon TenderIQ'dan foydalanmoqda
          </p>
          <Link href="/register" className="mt-8 inline-block">
            <Button size="lg" className="h-12 px-8 text-base bg-white text-blue-700 hover:bg-blue-50">
              Bepul ro'yxatdan o'tish
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                  TQ
                </div>
                <span className="text-lg font-bold text-white">TenderIQ</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                O'zbekiston davlat tenderlari uchun AI-powered razvedka platformasi.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Platforma</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/tenders" className="hover:text-white transition-colors">Tenderlar</Link></li>
                <li><Link href="/map" className="hover:text-white transition-colors">Xarita</Link></li>
                <li><Link href="/ratings" className="hover:text-white transition-colors">Reytinglar</Link></li>
                <li><Link href="/contracts" className="hover:text-white transition-colors">Shartnomalar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Yordam</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/knowledge-base" className="hover:text-white transition-colors">Bilimlar bazasi</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Texnik yordam</Link></li>
                <li><Link href="/news" className="hover:text-white transition-colors">Yangiliklar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Bog'lanish</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2"><Headphones className="h-4 w-4" /> +998 71 207 00 33</li>
                <li className="flex items-center gap-2"><Globe className="h-4 w-4" /> info@tenderiq.uz</li>
                <li className="flex items-center gap-2"><Clock className="h-4 w-4" /> 24/7 texnik yordam</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
            2024-2026 TenderIQ. Barcha huquqlar himoyalangan.
          </div>
        </div>
      </footer>
    </div>
  );
}
