"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  MapPin,
  PieChart,
  AlertTriangle,
  Trophy,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import api from "@/lib/api";
import { formatAmount, getCategoryLabel, getRegionLabel, formatDate } from "@/lib/format";
import { CATEGORIES, REGIONS } from "@/types";
import type { MarketOverview, CompetitorAnalysis, PriceHistory } from "@/types";

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

export default function AnalyticsPage() {
  const [market, setMarket] = useState<MarketOverview | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorAnalysis | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [anomalies, setAnomalies] = useState<Record<string, string>[]>([]);
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = {
          ...(category && { category }),
          ...(region && { region }),
        };
        const [marketRes, compRes, priceRes, anomalyRes] =
          await Promise.allSettled([
            api.get("/v1/analytics/market"),
            api.get("/v1/analytics/competitors", { params }),
            api.get("/v1/analytics/price-history", { params: { ...params, limit: 50 } }),
            api.get("/v1/analytics/anomalies", { params }),
          ]);
        if (marketRes.status === "fulfilled")
          setMarket(marketRes.value.data.data);
        if (compRes.status === "fulfilled")
          setCompetitors(compRes.value.data.data);
        if (priceRes.status === "fulfilled")
          setPriceHistory(priceRes.value.data.data);
        if (anomalyRes.status === "fulfilled")
          setAnomalies(anomalyRes.value.data.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [category, region]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const totalTenders =
    (market?.total_active_tenders ?? 0) + (market?.total_closed_tenders ?? 0);

  const regionChartData = market?.tender_count_by_region
    ? Object.entries(market.tender_count_by_region)
        .map(([key, value]) => ({
          name: getRegionLabel(key),
          count: value,
        }))
        .sort((a, b) => b.count - a.count)
    : [];

  const categoryChartData = market?.avg_amount_by_category
    ? Object.entries(market.avg_amount_by_category)
        .map(([key, value]) => ({
          name: getCategoryLabel(key),
          value: Math.round(value),
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  const pieData = categoryChartData.slice(0, 7);

  const priceChartData = priceHistory.map((p) => ({
    date: formatDate(p.date),
    amount: p.amount,
    category: getCategoryLabel(p.category),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analitika</h1>
          <p className="text-muted-foreground">
            Bozor tahlili, raqobatchilar va tendentsiyalar
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={category}
            onValueChange={(v) => setCategory(!v || v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Kategoriya" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={region}
            onValueChange={(v) => setRegion(!v || v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Viloyat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              {REGIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jami tenderlar</CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTenders}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px]">
                {market?.total_active_tenders ?? 0} faol
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {market?.total_closed_tenders ?? 0} yopilgan
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Raqobatchilar</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {competitors?.total_competitors ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Faol kompaniyalar soni
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              O&apos;rtacha summa
            </CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(competitors?.avg_tender_amount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tender uchun o&apos;rtacha
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Bozor konsentratsiyasi
            </CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {competitors?.market_concentration != null
                ? `${Math.round(competitors.market_concentration * 100)}%`
                : "—"}
            </div>
            <Progress
              value={(competitors?.market_concentration ?? 0) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Umumiy ko&apos;rinish</TabsTrigger>
          <TabsTrigger value="competitors">Raqobatchilar</TabsTrigger>
          <TabsTrigger value="prices">Narxlar tarixi</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaliyalar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4" />
                  Kategoriyalar bo&apos;yicha o&apos;rtacha summa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryChartData.length > 0 ? (
                  <ChartContainer
                    config={{
                      value: { label: "Summa", color: "var(--chart-1)" },
                    }}
                    className="h-[300px]"
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
                        {categoryChartData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <EmptyState />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  Viloyatlar bo&apos;yicha tenderlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {regionChartData.length > 0 ? (
                  <ChartContainer
                    config={{
                      count: { label: "Soni", color: "var(--chart-2)" },
                    }}
                    className="h-[300px]"
                  >
                    <BarChart data={regionChartData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={120}
                        tick={{ fontSize: 10 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {regionChartData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <EmptyState />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Kategoriya taqsimoti
                </CardTitle>
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
                        innerRadius={45}
                        outerRadius={85}
                        dataKey="value"
                        nameKey="name"
                      >
                        {pieData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RePieChart>
                  </ChartContainer>
                ) : (
                  <EmptyState />
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  Top tashkilotlar
                </CardTitle>
                <CardDescription>Eng faol tender e&apos;lon qiluvchilar</CardDescription>
              </CardHeader>
              <CardContent>
                {market?.top_organizations &&
                market.top_organizations.length > 0 ? (
                  <div className="space-y-2">
                    {market.top_organizations.slice(0, 8).map((org, i) => {
                      const maxCount = Math.max(
                        ...market.top_organizations.map((o) =>
                          Number(o.count ?? o.total ?? 1)
                        )
                      );
                      const count = Number(org.count ?? org.total ?? 0);
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate flex-1">
                              <span className="font-medium text-muted-foreground mr-2">
                                {i + 1}.
                              </span>
                              {String(org.name ?? org.organization ?? "Noma'lum")}
                            </span>
                            <Badge variant="secondary" className="ml-2">
                              {count}
                            </Badge>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Top raqobatchilar
              </CardTitle>
              <CardDescription>
                Eng faol va muvaffaqiyatli kompaniyalar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {competitors?.top_competitors &&
              competitors.top_competitors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Kompaniya</TableHead>
                      <TableHead className="text-center">G&apos;alabalar</TableHead>
                      <TableHead className="text-right">Jami summa</TableHead>
                      <TableHead className="text-right">O&apos;rtacha</TableHead>
                      <TableHead>Kategoriyalar</TableHead>
                      <TableHead>Viloyatlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitors.top_competitors.map((comp, i) => (
                      <TableRow key={comp.name}>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{comp.name}</p>
                            {comp.stir && (
                              <p className="text-xs text-muted-foreground">
                                STIR: {comp.stir}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{comp.total_wins}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(comp.total_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(comp.avg_winning_amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {comp.categories.slice(0, 3).map((cat) => (
                              <Badge
                                key={cat}
                                variant="outline"
                                className="text-[10px]"
                              >
                                {getCategoryLabel(cat)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {comp.regions.slice(0, 2).map((reg) => (
                              <Badge
                                key={reg}
                                variant="outline"
                                className="text-[10px]"
                              >
                                {getRegionLabel(reg)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState text="Raqobatchilar haqida ma'lumot mavjud emas" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Narxlar tarixi
              </CardTitle>
              <CardDescription>
                G&apos;olib bo&apos;lgan tenderlarning narx dinamikasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {priceChartData.length > 0 ? (
                <ChartContainer
                  config={{
                    amount: { label: "Summa (UZS)", color: "var(--chart-1)" },
                  }}
                  className="h-[400px]"
                >
                  <AreaChart data={priceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="var(--chart-1)"
                      fill="var(--chart-1)"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <EmptyState text="Narx tarixi ma'lumotlari mavjud emas" />
              )}

              {priceHistory.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">
                    So&apos;nggi g&apos;oliblar
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sana</TableHead>
                        <TableHead>Kategoriya</TableHead>
                        <TableHead>Viloyat</TableHead>
                        <TableHead>G&apos;olib</TableHead>
                        <TableHead className="text-right">Summa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {priceHistory.slice(0, 10).map((p, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">
                            {formatDate(p.date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {getCategoryLabel(p.category)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {getRegionLabel(p.region)}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {p.winner ?? "—"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatAmount(p.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Anomaliyalar va shubhali patternlar
              </CardTitle>
              <CardDescription>
                AI orqali aniqlangan g&apos;ayrioddiy holatlar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {anomalies.length > 0 ? (
                <div className="space-y-3">
                  {anomalies.map((anomaly, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30"
                    >
                      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {String(
                            anomaly.title ??
                              anomaly.description ??
                              anomaly.type ??
                              "Anomaliya aniqlandi"
                          )}
                        </p>
                        {anomaly.details && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {String(anomaly.details)}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {anomaly.category && (
                            <Badge variant="outline" className="text-[10px]">
                              {getCategoryLabel(String(anomaly.category))}
                            </Badge>
                          )}
                          {anomaly.region && (
                            <Badge variant="outline" className="text-[10px]">
                              {getRegionLabel(String(anomaly.region))}
                            </Badge>
                          )}
                          {anomaly.severity && (
                            <Badge
                              variant={
                                anomaly.severity === "high"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {String(anomaly.severity)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mb-3 opacity-30" />
                  <p className="font-medium">Anomaliyalar topilmadi</p>
                  <p className="text-sm">
                    Yetarli ma&apos;lumot yig&apos;ilganda AI tahlil qiladi
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ text }: { text?: string }) {
  return (
    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
      {text ?? "Ma'lumot yig'ilmoqda..."}
    </div>
  );
}
