"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  FileSearch,

  Map,
  Phone,
  Sparkles,
  Target,
  Users,
  FileText,
  Play,
} from "lucide-react";

interface LandingStats {
  total_tenders: number;
  active_tenders: number;
  total_companies: number;
  regions: number;
  by_category: { category: string; count: number }[];
  monthly: { month: string; count: number }[];
}

const features = [
  { icon: FileSearch, title: "Tender monitoring", desc: "Barcha davlat tenderlarini real vaqtda kuzatib boring.", color: "sky", stat: "142 faol" },
  { icon: Sparkles, title: "AI bashorat", desc: "Sun'iy intellekt yordamida g'alaba ehtimolini bilib oling.", color: "indigo", stat: "92% aniqlik" },
  { icon: Target, title: "Smart matching", desc: "Sizga mos tenderlarni avtomatik topib beradi.", color: "emerald", stat: "28 mos keldi" },
  { icon: BarChart3, title: "Analitika", desc: "Bozor tendensiyalari va narx dinamikasi tahlili.", color: "amber", stat: "Real-time" },
  { icon: Users, title: "Raqobat tahlili", desc: "Raqobatchilarning strategiyasini o'rganing.", color: "rose", stat: "10 kompaniya" },
  { icon: Map, title: "Hududiy xarita", desc: "O'zbekiston bo'ylab tenderlarni xaritada ko'ring.", color: "cyan", stat: "14 viloyat" },
  { icon: Bell, title: "Bildirishnomalar", desc: "Yangi tenderlar haqida darhol xabar oling.", color: "pink", stat: "Push · SMS" },
  { icon: FileText, title: "Hujjatlar bazasi", desc: "Tender hujjatlarini saqlang va boshqaring.", color: "violet", stat: "Cheksiz saqlash" },
];

const colorMap: Record<string, { bg: string; text: string; stat: string }> = {
  sky: { bg: "bg-sky-400/10", text: "text-sky-400", stat: "text-sky-400" },
  indigo: { bg: "bg-indigo-400/10", text: "text-indigo-400", stat: "text-emerald-400" },
  emerald: { bg: "bg-emerald-400/10", text: "text-emerald-400", stat: "text-emerald-400" },
  amber: { bg: "bg-amber-400/10", text: "text-amber-400", stat: "text-sky-400" },
  rose: { bg: "bg-rose-400/10", text: "text-rose-400", stat: "text-rose-400" },
  cyan: { bg: "bg-cyan-400/10", text: "text-cyan-400", stat: "text-cyan-400" },
  pink: { bg: "bg-pink-400/10", text: "text-pink-400", stat: "text-pink-400" },
  violet: { bg: "bg-violet-400/10", text: "text-violet-400", stat: "text-violet-400" },
};

const guides = [
  { num: "01", title: "Buyurtmachilar", desc: "Davlat tashkilotlari va buyurtmachilar haqida to'liq ma'lumot", color: "sky" },
  { num: "02", title: "Tender turlari", desc: "Ochiq, yopiq, ikki bosqichli tender turlari haqida", color: "indigo" },
  { num: "03", title: "Narx strategiyasi", desc: "Optimal narx taklifi tayyorlash bo'yicha qo'llanma", color: "emerald" },
  { num: "04", title: "Qonunchilik", desc: "Davlat xaridlari to'g'risidagi qonun va me'yoriy hujjatlar", color: "amber" },
];

const guideColorMap: Record<string, { bg: string; text: string; border: string }> = {
  sky: { bg: "bg-sky-400/10", text: "text-sky-400", border: "hover:border-sky-400/30" },
  indigo: { bg: "bg-indigo-400/10", text: "text-indigo-400", border: "hover:border-indigo-400/30" },
  emerald: { bg: "bg-emerald-400/10", text: "text-emerald-400", border: "hover:border-emerald-400/30" },
  amber: { bg: "bg-amber-400/10", text: "text-amber-400", border: "hover:border-amber-400/30" },
};

const steps = [
  { num: "01", title: "Ro'yxatdan o'ting", desc: "Kompaniya ma'lumotlarini kiriting va profilingizni sozlang", bg: "bg-sky-400" },
  { num: "02", title: "Tenderlarni toping", desc: "AI sizga mos tenderlarni avtomatik topib beradi", bg: "bg-indigo-400" },
  { num: "03", title: "Tahlil qiling", desc: "Raqobat va narx strategiyasini AI yordamida tahlil qiling", bg: "bg-emerald-400" },
  { num: "04", title: "G'olib bo'ling", desc: "Optimal taklifni yuboring va tenderni yuting", bg: "bg-amber-400" },
];

const tickerItems = [
  { dot: "bg-emerald-400", text: "Toshkent shahri · 142 faol tender" },
  { dot: "bg-sky-400", text: "MedTrans OOO · G'olib · 4.2 mlrd UZS" },
  { dot: "bg-emerald-400", text: "Samarqand viloyati · 89 yangi e'lon" },
  { dot: "bg-amber-400", text: "Farg'ona · Tibbiyot jihozlari · 2.1 mlrd UZS" },
  { dot: "bg-sky-400", text: "Buxoro · Qurilish · 18.5 mlrd UZS" },
];

export default function LandingPage() {
  const [stats, setStats] = useState<LandingStats | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
        const res = await fetch(`${base}/v1/public/stats`);
        if (res.ok) {
          const json = await res.json();
          setStats(json.data);
        }
      } catch {
        // Stats not available
      }
    }
    loadStats();
  }, []);

  const totalTenders = stats?.total_tenders?.toLocaleString("uz-UZ") ?? "12,482";
  const totalCompanies = stats?.total_companies?.toLocaleString("uz-UZ") ?? "3,247";

  return (
    <div className="landing-page min-h-screen selection:bg-sky-400/30">
      {/* LIVE TICKER */}
      <div className="h-9 bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/5 flex items-center overflow-hidden backdrop-blur-xl">
        <div className="flex marquee-scroll whitespace-nowrap gap-10 text-[11px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
              {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-sky-400 rounded-xl flex items-center justify-center">
              <span className="text-slate-950 font-extrabold text-sm">TQ</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Tender<span className="text-sky-500 dark:text-sky-400">IQ</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
            <a href="#imkoniyatlar" className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors">Imkoniyatlar</a>
            <a href="#yoriqnoma" className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors">Yo&apos;riqnoma</a>
            <a href="#statistika" className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors">Statistika</a>
            <a href="#bogla" className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors">Bog&apos;lanish</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:+998712070033" className="hidden lg:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-mono">
              <Phone className="h-4 w-4" />
              +998 71 207 00 33
            </a>
            <Link href="/login" className="px-5 py-2 text-sm font-semibold text-slate-700 dark:text-white hover:text-sky-500 dark:hover:text-sky-400 transition-colors no-underline">
              Kirish
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 bg-sky-400 text-slate-950 rounded-full text-sm font-bold hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transition-all no-underline"
            >
              Ro&apos;yxatdan o&apos;tish
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-sky-500/5 dark:bg-sky-500/10 blur-[140px] rounded-full" />
        <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] rounded-full" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-400/20 bg-sky-400/5 text-sky-500 dark:text-sky-400 text-xs font-bold uppercase tracking-widest mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
                </span>
                AI-V3 Algoritmi ishga tushdi
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white leading-[1.05] mb-8 tracking-tight">
                AI yordamida <br />tender <span className="gradient-text">g&apos;olibini</span> bashorat qiling
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-10 max-w-xl">
                Sun&apos;iy intellekt texnologiyalari asosida raqobatchilarni tahlil qiling, optimal narx strategiyasini tuzing va O&apos;zbekiston bo&apos;ylab tenderlarda g&apos;oliblik ehtimolingizni oshiring.
              </p>
              <div className="flex flex-wrap items-center gap-4 mb-12">
                <Link
                  href="/register"
                  className="h-14 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl font-bold flex items-center gap-3 hover:bg-sky-400 hover:text-slate-950 transition-all group no-underline"
                >
                  Batafsil ma&apos;lumot
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/register"
                  className="h-14 px-8 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl font-bold transition-all flex items-center gap-3 text-slate-700 dark:text-white no-underline"
                >
                  <Play className="h-5 w-5 text-sky-500 dark:text-sky-400" />
                  Demo ko&apos;rish
                </Link>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono uppercase tracking-widest mb-1">Jami tenderlar</span>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{totalTenders}</span>
                </div>
                <div className="w-px bg-slate-200 dark:bg-white/5" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono uppercase tracking-widest mb-1">Umumiy qiymat</span>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                    4.2 <span className="text-sm text-slate-400">TRLN UZS</span>
                  </span>
                </div>
                <div className="w-px bg-slate-200 dark:bg-white/5" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono uppercase tracking-widest mb-1">Aniqlik</span>
                  <span className="text-2xl font-extrabold text-emerald-500 dark:text-emerald-400 tabular-nums">92%</span>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative float-anim hidden lg:block">
              <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 to-indigo-400 rounded-[2rem] blur opacity-20 dark:opacity-30" />
              <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="h-11 border-b border-slate-100 dark:border-white/5 flex items-center justify-between px-5 bg-slate-50 dark:bg-slate-950/60">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">tenderiq.uz/dashboard</div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-emerald-500 dark:text-emerald-400">LIVE</span>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-sky-50 dark:bg-gradient-to-br dark:from-sky-500/20 dark:to-sky-500/5 border border-sky-200 dark:border-sky-400/20">
                      <div className="text-[10px] font-mono text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-2">G&apos;oliblik</div>
                      <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">84.2%</div>
                      <div className="h-1 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                        <div className="h-full w-[84%] bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full" />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5">
                      <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Faol</div>
                      <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">17</div>
                      <div className="flex gap-0.5 items-end h-6">
                        {[2, 3, 2, 4, 5, 3, 6].map((h, i) => (
                          <div key={i} className="w-1.5 rounded-sm bg-sky-400" style={{ height: `${(h / 6) * 100}%`, opacity: 0.3 + (h / 6) * 0.7 }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="h-1.5 w-1.5 bg-sky-400 rounded-full animate-pulse" />
                        So&apos;nggi tender
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">2m ago</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">Samarqand viloyati Urgut tumani</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 dark:text-slate-500">Yo&apos;l qoplama ta&apos;mirlash</span>
                      <span className="text-xs font-mono font-bold text-emerald-500 dark:text-emerald-400">4.2 mlrd UZS</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 text-center">
                      <div className="text-lg font-bold text-slate-900 dark:text-white">5</div>
                      <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">Yopilgan</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 text-center">
                      <div className="text-lg font-bold text-slate-900 dark:text-white">10</div>
                      <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase">Raqobat</div>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-400/20 text-center">
                      <div className="text-lg font-bold text-emerald-500 dark:text-emerald-400">&uarr;</div>
                      <div className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 uppercase">O&apos;sish</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-between gap-8 py-8 border-y border-slate-200 dark:border-white/5">
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ishonch bildirgan tashkilotlar</span>
            <div className="flex flex-wrap items-center gap-10 text-slate-300 dark:text-slate-600 font-bold text-lg">
              <span>UZINFOCOM</span><span>UZTELECOM</span><span>UZAUTO</span><span>NAVOIY KMK</span><span>ARTEL</span>
            </div>
          </div>
        </div>
      </section>

      {/* IMKONIYATLAR */}
      <section id="imkoniyatlar" className="max-w-7xl mx-auto px-6 py-24 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">Platforma imkoniyatlari</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-xl">Sizga mos xizmat turini tanlang va tenderda ishtirok eting.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => {
            const c = colorMap[f.color];
            const Icon = f.icon;
            return (
              <div key={f.title} className="card-hover-up p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 group shadow-sm dark:shadow-none">
                <div className="mb-6">
                  <div className={`h-12 w-12 ${c.bg} rounded-xl flex items-center justify-center ${c.text} group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{f.desc}</p>
                <div className={`flex items-center gap-2 text-xs font-mono ${c.stat}`}>
                  {f.stat}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* INFO HUB */}
      <section id="yoriqnoma" className="max-w-7xl mx-auto px-6 py-24">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-100 via-white to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950 border border-slate-200 dark:border-white/5 p-12 md:p-16">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="relative grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
                Tender sohasidagi<br /><span className="gradient-text">rasmiy ma&apos;lumot markazi</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8 max-w-lg">
                Tender jarayonlarida ishtirok etuvchi foydalanuvchilar uchun rasmiy ma&apos;lumotlar, yo&apos;riqnomalar va tizim yangiliklari.
              </p>
              <Link
                href="/knowledge-base"
                className="h-14 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl font-bold inline-flex items-center gap-3 hover:bg-sky-400 hover:text-slate-950 transition-all group no-underline"
              >
                Ma&apos;lumot olish
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {guides.map((g) => {
                const gc = guideColorMap[g.color];
                return (
                  <div key={g.num} className={`p-6 rounded-2xl bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 ${gc.border} transition-colors shadow-sm dark:shadow-none`}>
                    <div className={`h-10 w-10 rounded-lg ${gc.bg} flex items-center justify-center ${gc.text} mb-4 font-mono font-bold`}>
                      {g.num}
                    </div>
                    <h4 className="text-slate-900 dark:text-white font-bold mb-2">{g.title}</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{g.desc}</p>
                    <span className={`text-xs font-bold ${gc.text} flex items-center gap-1`}>
                      Batafsil <span>&rarr;</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* STATISTIKA */}
      <section id="statistika" className="max-w-7xl mx-auto px-6 py-24">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">Statistika</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-4">Tender tizimi va jarayon samaradorligi bo&apos;yicha asosiy ko&apos;rsatkichlar</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">Jami e&apos;lonlar</span>
              <span className="text-emerald-500 dark:text-emerald-400 text-xs font-mono font-bold">+18.2%</span>
            </div>
            <div className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tabular-nums">{totalTenders}</div>
            <svg viewBox="0 0 200 40" className="w-full h-10">
              <defs>
                <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline points="0,30 20,25 40,28 60,20 80,22 100,15 120,18 140,10 160,12 180,8 200,5 200,40 0,40" fill="url(#g1)" opacity="0.3" />
              <polyline points="0,30 20,25 40,28 60,20 80,22 100,15 120,18 140,10 160,12 180,8 200,5" fill="none" stroke="#38bdf8" strokeWidth="2" />
            </svg>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">Umumiy qiymat</span>
              <span className="text-emerald-500 dark:text-emerald-400 text-xs font-mono font-bold">+8.4%</span>
            </div>
            <div className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tabular-nums">
              4.2<span className="text-lg text-slate-400 ml-2">TRLN UZS</span>
            </div>
            <div className="flex gap-1 items-end h-10">
              {[40, 55, 45, 70, 80, 60, 95, 75, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-indigo-400 rounded-t" style={{ height: `${h}%`, opacity: 0.4 + (h / 100) * 0.6 }} />
              ))}
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ishtirokchilar</span>
              <span className="text-emerald-500 dark:text-emerald-400 text-xs font-mono font-bold">+124</span>
            </div>
            <div className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4 tabular-nums">{totalCompanies}</div>
            <div className="flex -space-x-2">
              {["from-sky-400 to-indigo-400", "from-emerald-400 to-sky-400", "from-rose-400 to-amber-400", "from-violet-400 to-pink-400"].map((g, i) => (
                <div key={i} className={`h-9 w-9 rounded-full bg-gradient-to-br ${g} border-2 border-white dark:border-slate-900`} />
              ))}
              <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-400">+3k</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Viloyatlar bo&apos;yicha faollik</h4>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">TOP 5</span>
            </div>
            <div className="space-y-3">
              {[
                { name: "Toshkent sh.", w: "95%", val: "6,241", color: "bg-gradient-to-r from-sky-400 to-sky-500" },
                { name: "Samarqand", w: "62%", val: "2,134", color: "bg-emerald-400" },
                { name: "Farg'ona", w: "48%", val: "1,589", color: "bg-amber-400" },
                { name: "Andijon", w: "38%", val: "1,247", color: "bg-rose-400" },
                { name: "Buxoro", w: "32%", val: "1,089", color: "bg-violet-400" },
              ].map((r) => (
                <div key={r.name} className="flex items-center gap-3">
                  <span className="w-32 text-xs text-slate-500 dark:text-slate-400">{r.name}</span>
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-950 rounded overflow-hidden">
                    <div className={`h-full ${r.color} rounded flex items-center justify-end pr-2`} style={{ width: r.w }}>
                      <span className="text-[10px] font-mono font-bold text-white dark:text-slate-950">{r.val}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Kategoriyalar bo&apos;yicha</h4>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">6 oy</span>
            </div>
            <div className="flex items-center gap-6">
              <svg viewBox="0 0 42 42" className="h-40 w-40 -rotate-90 shrink-0">
                <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#e2e8f0" strokeWidth="6" className="dark:hidden" />
                <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#1e293b" strokeWidth="6" className="hidden dark:block" />
                <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#38bdf8" strokeWidth="6" strokeDasharray="42 100" strokeDashoffset="0" />
                <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#10b981" strokeWidth="6" strokeDasharray="28 100" strokeDashoffset="-42" />
                <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#f59e0b" strokeWidth="6" strokeDasharray="18 100" strokeDashoffset="-70" />
                <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#818cf8" strokeWidth="6" strokeDasharray="12 100" strokeDashoffset="-88" />
              </svg>
              <div className="flex-1 space-y-2 text-xs">
                {[
                  { name: "Transport", pct: "42%", color: "bg-sky-400" },
                  { name: "Energetika", pct: "28%", color: "bg-emerald-400" },
                  { name: "Qurilish", pct: "18%", color: "bg-amber-400" },
                  { name: "Tibbiyot", pct: "12%", color: "bg-indigo-400" },
                ].map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className={`h-2 w-2 rounded-sm ${c.color}`} />
                      {c.name}
                    </span>
                    <span className="font-mono tabular-nums text-slate-900 dark:text-white">{c.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QANDAY ISHLAYDI */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">Qanday ishlaydi?</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-4">4 bosqichda tenderlarni yutishni boshlang</p>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="text-center relative">
                <div className="relative mx-auto mb-6">
                  <div className={`h-16 w-16 mx-auto rounded-2xl ${s.bg} text-slate-950 flex items-center justify-center font-extrabold text-2xl`}>
                    {s.num}
                  </div>
                  <div className={`absolute inset-0 mx-auto h-16 w-16 rounded-2xl ${s.bg} opacity-20 blur-xl`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="bogla" className="max-w-7xl mx-auto px-6 py-24">
        <div className="relative rounded-3xl overflow-hidden border border-sky-200 dark:border-sky-400/20 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-sky-500/10 dark:via-slate-900 dark:to-indigo-500/10 p-12 md:p-20 text-center">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-sky-500/10 dark:bg-sky-500/20 blur-[120px] rounded-full" />
          <div className="relative">
            <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6 tracking-tight">
              Bugun <span className="gradient-text">g&apos;olib</span> bo&apos;lishni boshlang
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-10">14 kunlik bepul sinov muddati. Karta ma&apos;lumotlarisiz.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="h-14 px-10 bg-sky-400 text-slate-950 rounded-xl font-bold hover:shadow-[0_0_40px_rgba(56,189,248,0.5)] transition-all no-underline inline-flex items-center"
              >
                Ro&apos;yxatdan o&apos;tish
              </Link>
              <a
                href="tel:+998712070033"
                className="h-14 px-10 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl font-bold text-slate-700 dark:text-white transition-all no-underline inline-flex items-center"
              >
                Bog&apos;lanish · +998 71 207 00 33
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-white/5 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-sky-400 rounded-lg flex items-center justify-center">
              <span className="text-slate-950 font-extrabold text-xs">TQ</span>
            </div>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">TenderIQ</span>
          </div>
          <div className="flex gap-8 text-[11px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500">
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">Maxfiylik</span>
            <span className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">Shartlar</span>
            <Link href="/contact" className="hover:text-slate-900 dark:hover:text-white transition-colors no-underline text-slate-400 dark:text-slate-500">Aloqa</Link>
          </div>
          <div className="text-[11px] font-mono text-slate-400 dark:text-slate-600">&copy; 2026 TenderIQ · Tashkent, UZ</div>
        </div>
      </footer>
    </div>
  );
}
