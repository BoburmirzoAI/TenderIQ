"use client";

import { useEffect, useState, useCallback } from "react";
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
  Wifi,
  WifiOff,
  Radio,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Line,
  LineChart,
  Cell,
  Pie,
  PieChart as RePieChart,
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";
import api from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";
import {
  formatAmount,
  formatDate,
  formatRelative,
  getStatusColor,
  getStatusLabel,
  getCategoryLabel,
  getRegionLabel,
} from "@/lib/format";
import type { Tender, UsageStats, MarketOverview, CompetitorAnalysis } from "@/types";
import { useAuthStore } from "@/store/auth";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
];

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  time: string;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { status: wsStatus, on } = useWebSocket();
  const [recentTenders, setRecentTenders] = useState<Tender[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [market, setMarket] = useState<MarketOverview | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorAnalysis | null>(null);
  const [activeTenders, setActiveTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Xush kelibsiz");
  const [dateStr, setDateStr] = useState("");
  const [liveActivities, setLiveActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(
      hour < 12 ? "Xayrli tong" : hour < 18 ? "Xayrli kun" : "Xayrli kech"
    );
    setDateStr(
      new Date().toLocaleDateString("uz-UZ", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    );
  }, []);

  useEffect(() => {
    const unsub1 = on("new_tender", (data) => {
      const tender = data as unknown as Tender;
      setRecentTenders((prev) => [tender, ...prev.slice(0, 7)]);
      setLiveActivities((prev) =>
        [
          {
            id: `tender-${tender.id}-${Date.now()}`,
            type: "new_tender",
            title: tender.title,
            time: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 10)
      );
      if (market) {
        setMarket((prev) =>
          prev ? { ...prev, total_active_tenders: (prev.total_active_tenders ?? 0) + 1 } : prev
        );
      }
    });

    const unsub2 = on("stats_update", (data) => {
      if (data.total_active_tenders != null) {
        setMarket((prev) => (prev ? { ...prev, ...data } as MarketOverview : prev));
      }
    });

    const unsub3 = on("notification", (data) => {
      setLiveActivities((prev) =>
        [
          {
            id: `notif-${Date.now()}`,
            type: "notification",
            title: String(data.title || "Yangi bildirishnoma"),
            time: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 10)
      );
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [on, market]);

  useEffect(() => {
    async function load() {
      try {
        const [tendersRes, usageRes, marketRes, competitorsRes, activeRes] =
          await Promise.allSettled([
            api.get("/v1/tenders/?per_page=8"),
            api.get("/v1/subscriptions/usage"),
            api.get("/v1/analytics/market"),
            api.get("/v1/analytics/competitors"),
            api.get("/v1/tenders/?status=active&per_page=5"),
          ]);
        if (tendersRes.status === "fulfilled")
          setRecentTenders(tendersRes.value.data.data);
        if (usageRes.status === "fulfilled")
          setUsage(usageRes.value.data.data);
        if (marketRes.status === "fulfilled")
          setMarket(marketRes.value.data.data);
        if (competitorsRes.status === "fulfilled")
          setCompetitors(competitorsRes.value.data.data);
        if (activeRes.status === "fulfilled")
          setActiveTenders(activeRes.value.data.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-96" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const usagePercent = usage
    ? Math.round(
        (usage.daily_requests_used / usage.daily_requests_limit) * 100
      )
    : 0;

  const totalTenders =
    (market?.total_active_tenders ?? 0) + (market?.total_closed_tenders ?? 0);

  const categoryChartData = market?.avg_amount_by_category
    ? Object.entries(market.avg_amount_by_category)
        .map(([key, value]) => ({
          name: getCategoryLabel(key),
          value: Math.round(value),
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  const regionChartData = market?.tender_count_by_region
    ? Object.entries(market.tender_count_by_region)
        .map(([key, value]) => ({
          name: getRegionLabel(key),
          count: value,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    : [];

  const pieData = market?.avg_amount_by_category
    ? Object.entries(market.avg_amount_by_category)
        .map(([key, value]) => ({
          name: getCategoryLabel(key),
          value: Math.round(value),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    : [];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {user?.full_name?.split(" ")[0] ?? "Foydalanuvchi"}!
          </h1>
          <p className="text-muted-foreground">
            TenderIQ platformasidagi bugungi holat
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={wsStatus === "connected" ? "default" : "outline"}
            className={`gap-1.5 py-1 ${
              wsStatus === "connected"
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : wsStatus === "connecting"
                ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                : ""
            }`}
          >
            {wsStatus === "connected" ? (
              <Wifi className="h-3 w-3" />
            ) : wsStatus === "connecting" ? (
              <Radio className="h-3 w-3 animate-pulse" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {wsStatus === "connected"
              ? "Jonli"
              : wsStatus === "connecting"
              ? "Ulanmoqda..."
              : "Oflayn"}
          </Badge>
          {dateStr && (
            <Badge variant="outline" className="gap-1 py-1">
              <Activity className="h-3 w-3" />
              {dateStr}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Faol tenderlar
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <FileSearch className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-3xl font-bold">
              {market?.total_active_tenders ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Jami {totalTenders} ta tender
            </p>
          </CardContent>
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-300 rounded-b-xl" />
        </Card>

        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Yopilgan tenderlar
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
              <Trophy className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-3xl font-bold">
              {market?.total_closed_tenders ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              G&apos;olib aniqlangan
            </p>
          </CardContent>
          <div className="h-1 bg-gradient-to-r from-green-500 to-green-300 rounded-b-xl" />
        </Card>

        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bozor trendi</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
              {market?.trend_direction === "up" ? (
                <TrendingUp className="h-4 w-4 text-purple-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-purple-500" />
              )}
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-3xl font-bold capitalize">
              {market?.trend_direction === "up"
                ? "O'sish"
                : market?.trend_direction === "down"
                ? "Pasayish"
                : "Barqaror"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bozor yo&apos;nalishi
            </p>
          </CardContent>
          <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-300 rounded-b-xl" />
        </Card>

        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Raqobatchilar
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
              <Target className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-3xl font-bold">
              {competitors?.total_competitors ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Faol kompaniyalar
            </p>
          </CardContent>
          <div className="h-1 bg-gradient-to-r from-orange-500 to-orange-300 rounded-b-xl" />
        </Card>
      </div>

      {/* Usage + Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Kunlik foydalanish
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-bold">
                    {usage?.daily_requests_used ?? 0}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {usage?.daily_requests_limit ?? 50} so&apos;rov
                  </span>
                </div>
                <Progress value={usagePercent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {usagePercent < 50
                    ? "Yaxshi — limitingizning yarmi ham ishlatilmagan"
                    : usagePercent < 80
                    ? "E'tibor — limitga yaqinlashmoqdasiz"
                    : "Ogohlantirish — limit tugash arafasida"}
                </p>
              </div>
              <Separator orientation="vertical" className="h-16" />
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {usage?.saved_tenders ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  Saqlangan
                  <br />
                  tenderlar
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Obuna
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  usage?.plan === "business"
                    ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
                    : usage?.plan === "pro"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold capitalize">
                  {usage?.plan ?? "Free"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {usage?.days_remaining != null
                    ? `${usage.days_remaining} kun qoldi`
                    : "Cheksiz"}
                </p>
              </div>
            </div>
            <Link href="/subscription">
              <Button variant="outline" size="sm" className="w-full mt-3">
                Rejani yangilash
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-500" />
              Tezkor harakatlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/tenders">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <FileSearch className="mr-2 h-3 w-3" />
                Tenderlarni ko&apos;rish
              </Button>
            </Link>
            <Link href="/company">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Building2 className="mr-2 h-3 w-3" />
                Kompaniya profili
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <BarChart3 className="mr-2 h-3 w-3" />
                Analitika
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-muted-foreground" />
              Kategoriyalar bo&apos;yicha o&apos;rtacha summa
            </CardTitle>
            <CardDescription>
              Har bir sohaning o&apos;rtacha tender summasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryChartData.length > 0 ? (
              <ChartContainer
                config={{
                  value: { label: "Summa (UZS)", color: "var(--chart-1)" },
                }}
                className="h-[280px]"
              >
                <BarChart data={categoryChartData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {categoryChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                Ma&apos;lumot yig&apos;ilmoqda...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Region Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              Viloyatlar bo&apos;yicha tenderlar
            </CardTitle>
            <CardDescription>
              Eng faol viloyatlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {regionChartData.length > 0 ? (
              <ChartContainer
                config={{
                  count: { label: "Soni", color: "var(--chart-2)" },
                }}
                className="h-[280px]"
              >
                <BarChart data={regionChartData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tick={{ fontSize: 10 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {regionChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                Ma&apos;lumot yig&apos;ilmoqda...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pie chart + Top organizations */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kategoriya taqsimoti</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ChartContainer
                config={{
                  value: { label: "Summa", color: "var(--chart-1)" },
                }}
                className="h-[250px]"
              >
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="value"
                    nameKey="name"
                    label={({ name }) => name}
                    labelLine={false}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`pie-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RePieChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                Ma&apos;lumot yig&apos;ilmoqda...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Organizations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top tashkilotlar</CardTitle>
            <CardDescription>Eng ko&apos;p tender e&apos;lon qilganlar</CardDescription>
          </CardHeader>
          <CardContent>
            {market?.top_organizations && market.top_organizations.length > 0 ? (
              <div className="space-y-3">
                {market.top_organizations.slice(0, 6).map((org, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0
                          ? "bg-amber-500/20 text-amber-600"
                          : i === 1
                          ? "bg-slate-300/30 text-slate-600"
                          : i === 2
                          ? "bg-orange-400/20 text-orange-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {String(org.name ?? org.organization ?? "Noma'lum")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {String(org.count ?? org.total ?? 0)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                Ma&apos;lumot mavjud emas
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Competitors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Top raqobatchilar
            </CardTitle>
            <CardDescription>Eng ko&apos;p g&apos;olib bo&apos;lganlar</CardDescription>
          </CardHeader>
          <CardContent>
            {competitors?.top_competitors &&
            competitors.top_competitors.length > 0 ? (
              <div className="space-y-3">
                {competitors.top_competitors.slice(0, 6).map((comp, i) => (
                  <div key={comp.name} className="flex items-center gap-3">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0
                          ? "bg-amber-500/20 text-amber-600"
                          : i === 1
                          ? "bg-slate-300/30 text-slate-600"
                          : i === 2
                          ? "bg-orange-400/20 text-orange-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {comp.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {comp.total_wins} ta g&apos;alaba
                      </p>
                    </div>
                    <span className="text-xs font-medium shrink-0">
                      {formatAmount(comp.avg_winning_amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                Ma&apos;lumot mavjud emas
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tenders Table + Deadline Tenders */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                So&apos;nggi tenderlar
              </CardTitle>
              <CardDescription>
                Eng yangi e&apos;lon qilingan tenderlar
              </CardDescription>
            </div>
            <Link href="/tenders">
              <Button variant="outline" size="sm">
                Barchasi <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTenders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileSearch className="h-12 w-12 mb-3 opacity-50" />
                  <p className="font-medium">Hozircha tenderlar yo&apos;q</p>
                  <p className="text-sm">
                    Tenderlar scraper orqali avtomatik yig&apos;iladi
                  </p>
                </div>
              ) : (
                recentTenders.map((tender, i) => (
                  <Link
                    key={tender.id}
                    href={`/tenders/${tender.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-all hover:bg-muted/50 hover:shadow-sm group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground shrink-0">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight truncate group-hover:text-primary transition-colors">
                          {tender.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground truncate">
                            {tender.organization ?? "—"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            &bull;
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {getCategoryLabel(tender.category)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatAmount(tender.amount)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDate(tender.deadline)}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(tender.status)}>
                        {getStatusLabel(tender.status)}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar: Deadlines + Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Yaqinlashayotgan muddatlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeTenders.length > 0 ? (
                <div className="space-y-3">
                  {activeTenders.map((tender) => (
                    <Link
                      key={tender.id}
                      href={`/tenders/${tender.id}`}
                      className="block"
                    >
                      <div className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                        <p className="text-xs font-medium line-clamp-2 mb-1">
                          {tender.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px]">
                            <Calendar className="mr-1 h-2.5 w-2.5" />
                            {formatDate(tender.deadline)}
                          </Badge>
                          <span className="text-[10px] font-medium">
                            {formatAmount(tender.amount)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Faol tenderlar yo&apos;q
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Radio className="h-4 w-4 text-green-500" />
                Jonli faoliyat
                {wsStatus === "connected" && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {liveActivities.length > 0 ? (
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {liveActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-2 rounded-lg border p-2 text-xs animate-in fade-in slide-in-from-top-1 duration-300"
                    >
                      <div className="mt-0.5 shrink-0">
                        {activity.type === "new_tender" ? (
                          <FileSearch className="h-3.5 w-3.5 text-blue-500" />
                        ) : (
                          <Bell className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{activity.title}</p>
                        <p className="text-muted-foreground text-[10px]">
                          {new Date(activity.time).toLocaleTimeString("uz-UZ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <Activity className="h-8 w-8 opacity-30 mb-2" />
                  <p className="text-xs">
                    {wsStatus === "connected"
                      ? "Yangiliklar kutilmoqda..."
                      : "Serverga ulanilmoqda..."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
