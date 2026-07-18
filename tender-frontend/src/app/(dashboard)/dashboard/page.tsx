"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileSearch,
  TrendingUp,
  TrendingDown,
  Building2,
  Clock,
  ArrowRight,
  BarChart3,
  Zap,
  Target,
  Trophy,
  AlertTriangle,
  Calendar,
  Activity,
  PieChart,
  MapPin,
  Flame,
  Star,
  Bell,
  Radio,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart as RePieChart,
} from "recharts";
import api from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";
import {
  formatAmount,
  formatDate,

  getCategoryLabel,
  getRegionLabel,
} from "@/lib/format";
import type { Tender, UsageStats, MarketOverview, CompetitorAnalysis } from "@/types";
import { useAuthStore } from "@/store/auth";

const CHART_COLORS = ["#0071e3", "#30d158", "#ff9f0a", "#ff453a", "#bf5af2", "#64d2ff", "#ffd60a", "#ff375f"];

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  time: string;
}

const statCards = [
  { key: "active", label: "Faol tenderlar", icon: FileSearch, lightBorder: "border-sky-200", darkBorder: "dark:border-sky-400/20", glow: "kpi-glow-blue", iconBg: "bg-sky-100 dark:bg-sky-400/10", iconColor: "text-sky-600 dark:text-sky-400", href: "/tenders?status=active" },
  { key: "closed", label: "Yopilgan", icon: Trophy, lightBorder: "border-emerald-200", darkBorder: "dark:border-emerald-400/20", glow: "kpi-glow-green", iconBg: "bg-emerald-100 dark:bg-emerald-400/10", iconColor: "text-emerald-600 dark:text-emerald-400", href: "/tenders?status=closed" },
  { key: "trend", label: "Bozor trendi", icon: TrendingUp, lightBorder: "border-indigo-200", darkBorder: "dark:border-indigo-400/20", glow: "kpi-glow-purple", iconBg: "bg-indigo-100 dark:bg-indigo-400/10", iconColor: "text-indigo-600 dark:text-indigo-400", href: "/analytics" },
  { key: "competitors", label: "Raqobatchilar", icon: Target, lightBorder: "border-amber-200", darkBorder: "dark:border-amber-400/20", glow: "kpi-glow-orange", iconBg: "bg-amber-100 dark:bg-amber-400/10", iconColor: "text-amber-600 dark:text-amber-400", href: "/competitors" },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { status: wsStatus, on } = useWebSocket();
  const [recentTenders, setRecentTenders] = useState<Tender[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [market, setMarket] = useState<MarketOverview | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorAnalysis | null>(null);
  const [activeTenders, setActiveTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting] = useState(() => { const h = new Date().getHours(); return h < 12 ? "Xayrli tong" : h < 18 ? "Xayrli kun" : "Xayrli kech"; });
  const [dateStr] = useState(() => new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long" }));
  const [liveActivities, setLiveActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const unsub1 = on("new_tender", (data) => {
      const tender = data as unknown as Tender;
      setRecentTenders((prev) => [tender, ...prev.slice(0, 7)]);
      setLiveActivities((prev) => [{ id: `tender-${tender.id}-${Date.now()}`, type: "new_tender", title: tender.title, time: new Date().toISOString() }, ...prev].slice(0, 10));
      if (market) setMarket((prev) => prev ? { ...prev, total_active_tenders: (prev.total_active_tenders ?? 0) + 1 } : prev);
    });
    const unsub2 = on("stats_update", (data) => {
      if (data.total_active_tenders != null) setMarket((prev) => (prev ? { ...prev, ...data } as MarketOverview : prev));
    });
    const unsub3 = on("notification", (data) => {
      setLiveActivities((prev) => [{ id: `notif-${Date.now()}`, type: "notification", title: String(data.title || "Yangi bildirishnoma"), time: new Date().toISOString() }, ...prev].slice(0, 10));
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [on, market]);

  useEffect(() => {
    async function load() {
      try {
        const [tendersRes, usageRes, marketRes, competitorsRes, activeRes] = await Promise.allSettled([
          api.get("/v1/tenders/?per_page=8"),
          api.get("/v1/subscriptions/usage"),
          api.get("/v1/analytics/market"),
          api.get("/v1/analytics/competitors"),
          api.get("/v1/tenders/?status=active&per_page=5"),
        ]);
        if (tendersRes.status === "fulfilled") setRecentTenders(tendersRes.value.data.data);
        if (usageRes.status === "fulfilled") setUsage(usageRes.value.data.data);
        if (marketRes.status === "fulfilled") setMarket(marketRes.value.data.data);
        if (competitorsRes.status === "fulfilled") setCompetitors(competitorsRes.value.data.data);
        if (activeRes.status === "fulfilled") setActiveTenders(activeRes.value.data.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-96 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[140px] rounded-2xl" />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const usagePercent = usage ? Math.round((usage.daily_requests_used / usage.daily_requests_limit) * 100) : 0;
  const totalTenders = (market?.total_active_tenders ?? 0) + (market?.total_closed_tenders ?? 0);

  const categoryChartData = market?.avg_amount_by_category
    ? Object.entries(market.avg_amount_by_category).map(([key, value]) => ({ name: getCategoryLabel(key), value: Math.round(value) })).sort((a, b) => b.value - a.value)
    : [];

  const regionChartData = market?.tender_count_by_region
    ? Object.entries(market.tender_count_by_region).map(([key, value]) => ({ name: getRegionLabel(key), count: value })).sort((a, b) => b.count - a.count).slice(0, 8)
    : [];

  const pieData = market?.avg_amount_by_category
    ? Object.entries(market.avg_amount_by_category).map(([key, value]) => ({ name: getCategoryLabel(key), value: Math.round(value) })).sort((a, b) => b.value - a.value).slice(0, 6)
    : [];

  const statValues: Record<string, string | number> = {
    active: market?.total_active_tenders ?? 0,
    closed: market?.total_closed_tenders ?? 0,
    trend: market?.trend_direction === "up" ? "O'sish" : market?.trend_direction === "down" ? "Pasayish" : "Barqaror",
    competitors: competitors?.total_competitors ?? 0,
  };

  const statSubs: Record<string, string> = {
    active: `Jami ${totalTenders} ta tender`,
    closed: "G'olib aniqlangan",
    trend: "Bozor yo'nalishi",
    competitors: "Faol kompaniyalar",
  };

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 slide-in">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-0.04em] leading-none">
            {greeting}, {user?.full_name?.split(" ")[0] ?? "Foydalanuvchi"}!
          </h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            TenderIQ platformasidagi bugungi holat {dateStr && <>· {dateStr}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tenders">
            <button className="h-9 px-4 bg-sky-400 text-slate-950 rounded-lg text-sm font-bold hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              Tender qidirish
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.key === "trend" && market?.trend_direction === "down" ? TrendingDown : card.icon;
          return (
            <Link key={card.key} href={card.href}>
              <div
                className={`group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl dark:bg-slate-900 border ${card.lightBorder} ${card.darkBorder} dark:${card.glow} p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer`}
              >
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[13px] font-semibold text-muted-foreground">{card.label}</span>
                      <div className="text-[11px] text-muted-foreground/60 mt-0.5">{statSubs[card.key]}</div>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                  </div>
                  <div className="text-[36px] font-extrabold tracking-[-0.04em] leading-none mb-3">
                    {statValues[card.key]}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-500 font-bold">
                      {card.key === "active" ? `+${Math.max(1, Math.floor((market?.total_active_tenders ?? 0) * 0.1))} →` : card.key === "closed" ? "100% →" : ""}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground/60 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Usage + Subscription + Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Usage */}
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-500/10">
              <Zap className="h-4 w-4 text-yellow-500" />
            </div>
            <span className="text-[16px] font-bold">Kunlik foydalanish</span>
          </div>
          <div className="flex items-end gap-1 mb-1">
            <span className="text-[36px] font-extrabold tracking-[-0.04em] leading-none">
              {usage?.daily_requests_used ?? 0}
            </span>
            <span className="text-[14px] text-muted-foreground mb-1">
              / {usage?.daily_requests_limit ?? 50}
            </span>
          </div>
          <div className="h-2 rounded-full bg-black/[0.04] overflow-hidden mt-3 mb-2 dark:bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                usagePercent < 50 ? "bg-gradient-to-r from-green-500 to-emerald-400"
                : usagePercent < 80 ? "bg-gradient-to-r from-yellow-500 to-amber-400"
                : "bg-gradient-to-r from-red-500 to-orange-400"
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className="text-[12px] text-muted-foreground">
            {usagePercent < 50 ? "Limitingiz yetarli" : usagePercent < 80 ? "Limitga yaqinlashmoqdasiz" : "Limit tugash arafasida"}
          </p>
          <div className="mt-4 pt-4 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">Saqlangan tenderlar</span>
            <span className="text-[18px] font-bold">{usage?.saved_tenders ?? 0}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/tenders">
              <button className="w-full rounded-xl bg-sky-400/10 text-sky-500 py-2 text-[12px] font-semibold transition-all hover:bg-sky-400/20 active:scale-[0.97]">
                Tender qidirish
              </button>
            </Link>
            <Link href="/saved-searches">
              <button className="w-full rounded-xl bg-purple-500/10 text-purple-600 py-2 text-[12px] font-semibold transition-all hover:bg-purple-500/20 active:scale-[0.97]">
                Saqlangan qidiruvlar
              </button>
            </Link>
          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
              <Star className="h-4 w-4 text-amber-500" />
            </div>
            <span className="text-[16px] font-bold">Obuna</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              usage?.plan === "business" ? "bg-gradient-to-br from-amber-500 to-orange-600"
              : usage?.plan === "pro" ? "bg-gradient-to-br from-sky-400 to-indigo-600"
              : "bg-gradient-to-br from-gray-400 to-gray-500"
            } text-white shadow-lg`}>
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[18px] font-bold capitalize">{usage?.plan ?? "Free"}</p>
              <p className="text-[12px] text-muted-foreground">
                {usage?.days_remaining != null ? `${usage.days_remaining} kun qoldi` : "Cheksiz"}
              </p>
            </div>
          </div>
          <Link href="/subscription">
            <button className="w-full rounded-xl bg-[#1d1d1f] text-white py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-md active:scale-[0.98] dark:bg-white dark:text-[#1d1d1f]">
              Rejani yangilash
            </button>
          </Link>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/payments">
              <button className="w-full rounded-xl bg-green-500/10 text-green-600 py-2 text-[12px] font-semibold transition-all hover:bg-green-500/20 active:scale-[0.97]">
                To&apos;lovlar tarixi
              </button>
            </Link>
            <Link href="/support">
              <button className="w-full rounded-xl bg-orange-500/10 text-orange-600 py-2 text-[12px] font-semibold transition-all hover:bg-orange-500/20 active:scale-[0.97]">
                Yordam markazi
              </button>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10">
              <Flame className="h-4 w-4 text-red-500" />
            </div>
            <span className="text-[16px] font-bold">Tezkor harakatlar</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/tenders", icon: FileSearch, label: "Tenderlar", color: "text-sky-400", bg: "bg-sky-400/10", hoverBorder: "hover:border-sky-400/40" },
              { href: "/matched", icon: Target, label: "Mos", color: "text-emerald-400", bg: "bg-emerald-400/10", hoverBorder: "hover:border-emerald-400/40" },
              { href: "/company", icon: Building2, label: "Kompaniya", color: "text-indigo-400", bg: "bg-indigo-400/10", hoverBorder: "hover:border-indigo-400/40" },
              { href: "/analytics", icon: BarChart3, label: "Analitika", color: "text-amber-400", bg: "bg-amber-400/10", hoverBorder: "hover:border-amber-400/40" },
              { href: "/ml", icon: Sparkles, label: "AI bashorat", color: "text-violet-400", bg: "bg-violet-400/10", hoverBorder: "hover:border-violet-400/40" },
              { href: "/map", icon: MapPin, label: "Xarita", color: "text-cyan-400", bg: "bg-cyan-400/10", hoverBorder: "hover:border-cyan-400/40" },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <div className={`aspect-square rounded-xl bg-black/[0.02] dark:bg-slate-950/60 border border-black/[0.04] dark:border-white/5 ${action.hoverBorder} flex flex-col items-center justify-center gap-1 transition-colors group/action cursor-pointer`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.bg} group-hover/action:scale-110 transition-transform`}>
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <span className="text-[10px] font-bold">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Category Chart */}
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <PieChart className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-[16px] font-bold">Kategoriyalar bo&apos;yicha summa</h3>
          </div>
          <p className="text-[13px] text-muted-foreground mb-4">Har bir sohaning o&apos;rtacha tender summasi</p>
          {categoryChartData.length > 0 ? (
            <ChartContainer config={{ value: { label: "Summa (UZS)", color: "var(--chart-1)" } }} className="h-[260px]">
              <BarChart data={categoryChartData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {categoryChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex flex-col h-[260px] items-center justify-center text-muted-foreground">
              <div className="h-12 w-12 rounded-2xl bg-black/[0.03] flex items-center justify-center mb-3 dark:bg-white/[0.05]">
                <PieChart className="h-5 w-5 opacity-30" />
              </div>
              <p className="text-[13px] font-medium">Ma&apos;lumot yig&apos;ilmoqda...</p>
              <p className="text-[11px] mt-1 mb-3">Scraper ma&apos;lumotlarni avtomatik yig&apos;adi</p>
              <Link href="/analytics">
                <button className="rounded-xl bg-sky-400/10 text-sky-500 px-4 py-1.5 text-[11px] font-semibold transition-all hover:bg-sky-400/20">
                  Analitikaga o&apos;tish
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Region Chart */}
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-[16px] font-bold">Viloyatlar bo&apos;yicha tenderlar</h3>
          </div>
          <p className="text-[13px] text-muted-foreground mb-4">Eng faol viloyatlar</p>
          {regionChartData.length > 0 ? (
            <ChartContainer config={{ count: { label: "Soni", color: "var(--chart-2)" } }} className="h-[260px]">
              <BarChart data={regionChartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {regionChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex flex-col h-[260px] items-center justify-center text-muted-foreground">
              <div className="h-12 w-12 rounded-2xl bg-black/[0.03] flex items-center justify-center mb-3 dark:bg-white/[0.05]">
                <MapPin className="h-5 w-5 opacity-30" />
              </div>
              <p className="text-[13px] font-medium">Viloyat ma&apos;lumotlari yo&apos;q</p>
              <p className="text-[11px] mt-1 mb-3">Tenderlar paydo bo&apos;lganda to&apos;ldiriladi</p>
              <Link href="/map">
                <button className="rounded-xl bg-cyan-500/10 text-cyan-600 px-4 py-1.5 text-[11px] font-semibold transition-all hover:bg-cyan-500/20">
                  Xaritani ko&apos;rish
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Pie + Rankings */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Pie */}
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <h3 className="text-[16px] font-bold mb-4">Kategoriya taqsimoti</h3>
          {pieData.length > 0 ? (
            <ChartContainer config={{ value: { label: "Summa", color: "var(--chart-1)" } }} className="h-[240px]">
              <RePieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" nameKey="name" label={({ name }) => name} labelLine={false}>
                  {pieData.map((_, index) => (
                    <Cell key={`pie-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </RePieChart>
            </ChartContainer>
          ) : (
            <div className="flex flex-col h-[240px] items-center justify-center text-muted-foreground">
              <div className="h-10 w-10 rounded-xl bg-black/[0.03] flex items-center justify-center mb-2 dark:bg-white/[0.05]">
                <PieChart className="h-4 w-4 opacity-30" />
              </div>
              <p className="text-[12px] font-medium">Hali ma&apos;lumot yo&apos;q</p>
              <Link href="/tenders" className="mt-2">
                <button className="rounded-lg bg-sky-400/10 text-sky-500 px-3 py-1 text-[11px] font-semibold hover:bg-sky-400/20">
                  Tenderlarni ko&apos;rish
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Top Organizations */}
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <h3 className="text-[16px] font-bold mb-1">Top tashkilotlar</h3>
          <p className="text-[13px] text-muted-foreground mb-4">Eng ko&apos;p tender e&apos;lon qilganlar</p>
          {market?.top_organizations && market.top_organizations.length > 0 ? (
            <div className="space-y-2">
              {market.top_organizations.slice(0, 6).map((org, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                    i === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                    : i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                    : i === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                    : "bg-black/[0.04] text-muted-foreground dark:bg-white/[0.06]"
                  }`}>
                    {i + 1}
                  </div>
                  <p className="text-[12px] font-medium truncate flex-1">{String(org.name ?? org.organization ?? "Noma'lum")}</p>
                  <span className="text-[11px] font-bold rounded-full bg-black/[0.04] px-2.5 py-0.5 dark:bg-white/[0.06]">{String(org.count ?? org.total ?? 0)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col h-[200px] items-center justify-center text-muted-foreground">
              <div className="h-10 w-10 rounded-xl bg-black/[0.03] flex items-center justify-center mb-2 dark:bg-white/[0.05]">
                <Building2 className="h-4 w-4 opacity-30" />
              </div>
              <p className="text-[12px] font-medium">Tashkilotlar topilmadi</p>
              <Link href="/tenders" className="mt-2">
                <button className="rounded-lg bg-purple-500/10 text-purple-600 px-3 py-1 text-[11px] font-semibold hover:bg-purple-500/20">
                  Tenderlarni ko&apos;rish
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Top Competitors */}
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-[16px] font-bold">Top raqobatchilar</h3>
          </div>
          <p className="text-[13px] text-muted-foreground mb-4">Eng ko&apos;p g&apos;olib bo&apos;lganlar</p>
          {competitors?.top_competitors && competitors.top_competitors.length > 0 ? (
            <div className="space-y-2">
              {competitors.top_competitors.slice(0, 6).map((comp, i) => (
                <div key={`${comp.name}-${i}`} className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                    i === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                    : i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                    : i === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                    : "bg-black/[0.04] text-muted-foreground dark:bg-white/[0.06]"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate">{comp.name}</p>
                    <p className="text-[10px] text-muted-foreground">{comp.total_wins} ta g&apos;alaba</p>
                  </div>
                  <span className="text-[12px] font-semibold shrink-0">{formatAmount(comp.avg_winning_amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col h-[200px] items-center justify-center text-muted-foreground">
              <div className="h-10 w-10 rounded-xl bg-black/[0.03] flex items-center justify-center mb-2 dark:bg-white/[0.05]">
                <Target className="h-4 w-4 opacity-30" />
              </div>
              <p className="text-[12px] font-medium">Raqobatchilar topilmadi</p>
              <Link href="/competitors" className="mt-2">
                <button className="rounded-lg bg-orange-500/10 text-orange-600 px-3 py-1 text-[11px] font-semibold hover:bg-orange-500/20">
                  Raqobatchilarni ko&apos;rish
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Tenders + Sidebar */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Recent Tenders */}
        <div className="lg:col-span-2 rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl overflow-hidden dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <div className="flex items-center justify-between p-6 pb-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-[16px] font-bold">So&apos;nggi tenderlar</h3>
              </div>
              <p className="text-[13px] text-muted-foreground">Eng yangi e&apos;lon qilingan tenderlar</p>
            </div>
            <Link href="/tenders">
              <span className="text-xs font-bold text-sky-500 dark:text-sky-400 flex items-center gap-1 hover:gap-2 transition-all">
                Barchasi →
              </span>
            </Link>
          </div>
          <div className="p-4">
            {recentTenders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="h-14 w-14 rounded-2xl bg-black/[0.03] flex items-center justify-center mb-3 dark:bg-white/[0.05]">
                  <FileSearch className="h-6 w-6 opacity-40" />
                </div>
                <p className="text-[14px] font-semibold">Hozircha tenderlar yo&apos;q</p>
                <p className="text-[12px] text-muted-foreground mt-1">Tenderlar scraper orqali avtomatik yig&apos;iladi</p>
                <div className="flex gap-2 mt-4">
                  <Link href="/tenders">
                    <button className="rounded-xl bg-sky-400/10 text-sky-500 px-4 py-2 text-[12px] font-semibold transition-all hover:bg-sky-400/20">
                      Tenderlarni qidirish
                    </button>
                  </Link>
                  <Link href="/saved-searches">
                    <button className="rounded-xl bg-purple-500/10 text-purple-600 px-4 py-2 text-[12px] font-semibold transition-all hover:bg-purple-500/20">
                      Qidiruv saqlash
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              recentTenders.map((tender, i) => {
                const indexColors = ["text-sky-400", "text-emerald-400", "text-indigo-400", "text-amber-400", "text-rose-400", "text-violet-400", "text-cyan-400", "text-pink-400"];
                return (
                  <Link key={tender.id} href={`/tenders/${tender.id}`}>
                    <div className="group/tender flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-sky-400/20 dark:hover:border-sky-400/30 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-all cursor-pointer">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-black/[0.03] dark:bg-slate-950 border border-black/[0.04] dark:border-white/5 font-mono font-bold text-sm shrink-0 ${indexColors[i % indexColors.length]}`}>
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold leading-tight truncate group-hover/tender:text-sky-500 dark:group-hover/tender:text-sky-400 transition-colors">{tender.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {tender.organization ?? "—"} · {getCategoryLabel(tender.category)}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-[13px] font-extrabold tabular-nums">{formatAmount(tender.amount)}</p>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase">{formatDate(tender.deadline)}</p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Deadlines */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h3 className="text-[14px] font-bold">Yaqin muddatlar</h3>
            </div>
            {activeTenders.length > 0 ? (
              <div className="space-y-2">
                {activeTenders.map((tender) => (
                  <Link key={tender.id} href={`/tenders/${tender.id}`}>
                    <div className="rounded-xl border border-black/[0.04] p-3 transition-all hover:bg-black/[0.02] hover:shadow-sm dark:border-white/[0.04] dark:hover:bg-white/[0.02]">
                      <p className="text-[12px] font-medium line-clamp-2 mb-2">{tender.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full bg-amber-500/10 text-amber-600 px-2 py-0.5">
                          <Calendar className="h-2.5 w-2.5" />
                          {formatDate(tender.deadline)}
                        </span>
                        <span className="text-[11px] font-bold">{formatAmount(tender.amount)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-4 text-muted-foreground">
                <p className="text-[13px] font-medium">Faol tenderlar yo&apos;q</p>
                <Link href="/tenders?status=active" className="mt-2">
                  <button className="rounded-lg bg-amber-500/10 text-amber-600 px-3 py-1.5 text-[11px] font-semibold hover:bg-amber-500/20">
                    Faol tenderlarni ko&apos;rish
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Live Activity */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="h-4 w-4 text-green-500" />
              <h3 className="text-[14px] font-bold">Jonli faoliyat</h3>
              {wsStatus === "connected" && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              )}
            </div>
            {liveActivities.length > 0 ? (
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {liveActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2.5 rounded-xl border border-black/[0.04] p-2.5 text-[12px] dark:border-white/[0.04]">
                    <div className="mt-0.5 shrink-0">
                      {activity.type === "new_tender" ? (
                        <div className="h-6 w-6 rounded-lg bg-sky-400/10 flex items-center justify-center">
                          <FileSearch className="h-3 w-3 text-sky-400" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Bell className="h-3 w-3 text-amber-500" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{activity.title}</p>
                      <p className="text-muted-foreground text-[10px]">{new Date(activity.time).toLocaleTimeString("uz-UZ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <div className="h-10 w-10 rounded-xl bg-black/[0.03] flex items-center justify-center mb-2 dark:bg-white/[0.05]">
                  <Activity className="h-4 w-4 opacity-30" />
                </div>
                <p className="text-[12px]">{wsStatus === "connected" ? "Yangiliklar kutilmoqda..." : "Serverga ulanilmoqda..."}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
