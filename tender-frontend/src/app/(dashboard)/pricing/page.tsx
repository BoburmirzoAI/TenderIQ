"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {


  Target,
  Loader2,
  Search,
  BarChart3,
  MapPin,
  Tag,
  Zap,
  Shield,
  Flame,
  History,
  Trophy,
  XCircle,
} from "lucide-react";
import api from "@/lib/api";

interface DiscountStats {
  avg_pct: number;
  median_pct: number;
  min_pct: number;
  max_pct: number;
  p25_pct: number;
  p75_pct: number;
}

interface Recommendation {
  price: number;
  discount_pct: number;
  win_chance: string;
  description: string;
}

interface Distribution {
  label: string;
  count: number;
  pct: number;
}

interface PriceAnalysis {
  tender_id: number;
  tender_amount: number;
  currency: string;
  category: string | null;
  region: string | null;
  has_data: boolean;
  message?: string;
  sample_count: number;
  discount_stats?: DiscountStats;
  recommendations?: {
    conservative: Recommendation;
    optimal: Recommendation;
    aggressive: Recommendation;
  };
  distribution?: Distribution[];
}

interface CategoryStat {
  category: string;
  total_tenders: number;
  avg_discount_pct: number;
  min_discount_pct: number;
  max_discount_pct: number;
  avg_winning_amount: number;
}

interface RegionStat {
  region: string;
  total_tenders: number;
  avg_discount_pct: number;
  avg_winning_amount: number;
}

interface BidItem {
  tender_id: number;
  title: string;
  category: string | null;
  tender_amount: number;
  bid_amount: number;
  discount_pct: number;
  result: string | null;
  stage: string;
}

interface MyHistory {
  summary: {
    total_bids: number;
    wins: number;
    losses: number;
    win_rate: number;
    avg_win_discount: number | null;
    avg_loss_discount: number | null;
  };
  bids: BidItem[];
}

function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} mlrd`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} mln`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)} ming`;
  return amount.toFixed(0);
}

export default function PricingPage() {
  const [tenderId, setTenderId] = useState("");
  const [analysis, setAnalysis] = useState<PriceAnalysis | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [regionStats, setRegionStats] = useState<RegionStat[]>([]);
  const [myHistory, setMyHistory] = useState<MyHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [catRes, regRes, histRes] = await Promise.all([
        api.get("/v1/pricing/category-stats"),
        api.get("/v1/pricing/region-stats"),
        api.get("/v1/pricing/my-history"),
      ]);
      setCategoryStats(catRes.data.data || []);
      setRegionStats(regRes.data.data || []);
      setMyHistory(histRes.data.data || null);
    } catch {
      // silently handle
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const analyzeTender = async () => {
    const id = parseInt(tenderId);
    if (!id || id <= 0) return;
    setLoading(true);
    try {
      const res = await api.get(`/v1/pricing/analyze/${id}`);
      setAnalysis(res.data.data);
    } catch {
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const maxDistCount = analysis?.distribution
    ? Math.max(...analysis.distribution.map((d) => d.count), 1)
    : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Narx strategiyasi</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Tarixiy ma&apos;lumotlar asosida optimal narx tahlili
        </p>
      </div>

      {/* Search Card */}
      <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-5 w-5" />
          <h2 className="text-[15px] font-semibold">Tender narxini tahlil qilish</h2>
        </div>
        <p className="text-[13px] text-muted-foreground mb-4">
          Tender ID kiriting — o&apos;xshash tenderlar asosida optimal narx tavsiya qilinadi
        </p>
        <div className="flex gap-3">
          <input
            placeholder="Tender ID kiriting..."
            value={tenderId}
            onChange={(e) => setTenderId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyzeTender()}
            type="number"
            className="max-w-xs rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] outline-none transition-all focus:ring-2 focus:ring-sky-400/30 focus:border-sky-300 dark:border-white/10 dark:bg-white/5 dark:focus:ring-sky-400/30"
          />
          <button
            onClick={analyzeTender}
            disabled={loading || !tenderId}
            className="rounded-full bg-[#1d1d1f] text-white px-6 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Tahlil qilish
          </button>
        </div>
      </div>

      {analysis && (
        <div className="space-y-4">
          {!analysis.has_data ? (
            <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
              <div className="py-8 text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{analysis.message}</p>
                <p className="text-sm mt-1">
                  Topilgan natijalar: {analysis.sample_count}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Conservative */}
                <div className="rounded-2xl border border-green-200/60 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-green-500/20 transition-all hover:shadow-lg hover:scale-[1.02]">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Konservativ</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatAmount(analysis.recommendations!.conservative.price)}{" "}
                    <span className="text-sm font-normal">{analysis.currency}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    -{analysis.recommendations!.conservative.discount_pct}% chegirma
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {analysis.recommendations!.conservative.description}
                  </p>
                </div>

                {/* Optimal */}
                <div className="rounded-2xl border border-sky-200/60 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-sky-400/20 ring-2 ring-sky-400/20 transition-all hover:shadow-lg hover:scale-[1.02]">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-sky-500" />
                    <span className="text-sm font-medium">Optimal</span>
                    <span className="rounded-full bg-sky-100 text-sky-600 px-2.5 py-0.5 text-[12px] font-semibold dark:bg-sky-900/40 dark:text-sky-300">Tavsiya</span>
                  </div>
                  <div className="text-2xl font-bold text-sky-500">
                    {formatAmount(analysis.recommendations!.optimal.price)}{" "}
                    <span className="text-sm font-normal">{analysis.currency}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    -{analysis.recommendations!.optimal.discount_pct}% chegirma
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {analysis.recommendations!.optimal.description}
                  </p>
                </div>

                {/* Aggressive */}
                <div className="rounded-2xl border border-orange-200/60 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-orange-500/20 transition-all hover:shadow-lg hover:scale-[1.02]">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Agressiv</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatAmount(analysis.recommendations!.aggressive.price)}{" "}
                    <span className="text-sm font-normal">{analysis.currency}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    -{analysis.recommendations!.aggressive.discount_pct}% chegirma
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {analysis.recommendations!.aggressive.description}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Distribution */}
                <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
                  <h3 className="text-sm font-medium mb-1">Chegirma taqsimoti</h3>
                  <p className="text-[13px] text-muted-foreground mb-4">
                    {analysis.sample_count} ta yakunlangan tender asosida
                  </p>
                  <div className="space-y-3">
                    {analysis.distribution!.map((d) => (
                      <div key={d.label} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{d.label}</span>
                          <span className="text-muted-foreground">
                            {d.count} ta ({d.pct}%)
                          </span>
                        </div>
                        <Progress
                          value={(d.count / maxDistCount) * 100}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Statistics */}
                <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
                  <h3 className="text-sm font-medium mb-4">Statistika</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Tender summasi</p>
                      <p className="text-lg font-semibold">
                        {formatAmount(analysis.tender_amount)} {analysis.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Namunalar</p>
                      <p className="text-lg font-semibold">{analysis.sample_count} ta</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">O&apos;rtacha chegirma</p>
                      <p className="text-lg font-semibold">
                        {analysis.discount_stats!.avg_pct}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Median chegirma</p>
                      <p className="text-lg font-semibold">
                        {analysis.discount_stats!.median_pct}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Min chegirma</p>
                      <p className="text-lg font-semibold">
                        {analysis.discount_stats!.min_pct}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Max chegirma</p>
                      <p className="text-lg font-semibold">
                        {analysis.discount_stats!.max_pct}%
                      </p>
                    </div>
                  </div>
                  {analysis.category && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                      <Tag className="h-3 w-3" /> {analysis.category}
                    </div>
                  )}
                  {analysis.region && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" /> {analysis.region}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">
            <Tag className="h-4 w-4 mr-1" /> Kategoriyalar
          </TabsTrigger>
          <TabsTrigger value="regions">
            <MapPin className="h-4 w-4 mr-1" /> Hududlar
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-1" /> Mening tarixim
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-4">
          {statsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : categoryStats.length === 0 ? (
            <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
              <div className="py-8 text-center text-muted-foreground">
                Ma&apos;lumot topilmadi
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {categoryStats.map((cat) => (
                <div key={cat.category} className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg hover:scale-[1.01]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm truncate">{cat.category}</h3>
                    <span className="rounded-full border border-black/10 bg-white/70 backdrop-blur px-2.5 py-0.5 text-[12px] font-semibold dark:border-white/10 dark:bg-white/5">{cat.total_tenders} ta</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">O&apos;rtacha</p>
                      <p className="font-semibold text-sky-500 dark:text-sky-400">
                        {cat.avg_discount_pct}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Min</p>
                      <p className="font-semibold text-green-600">
                        {cat.min_discount_pct}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Max</p>
                      <p className="font-semibold text-orange-600">
                        {cat.max_discount_pct}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Progress value={cat.avg_discount_pct} className="h-1.5" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    O&apos;rtacha g&apos;olib: {formatAmount(cat.avg_winning_amount)} UZS
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="regions" className="mt-4">
          {statsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : regionStats.length === 0 ? (
            <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
              <div className="py-8 text-center text-muted-foreground">
                Ma&apos;lumot topilmadi
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {regionStats.map((reg) => (
                <div key={reg.region} className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg hover:scale-[1.01]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {reg.region}
                    </h3>
                    <span className="rounded-full border border-black/10 bg-white/70 backdrop-blur px-2.5 py-0.5 text-[12px] font-semibold dark:border-white/10 dark:bg-white/5">{reg.total_tenders} ta</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">O&apos;rtacha chegirma</p>
                      <p className="text-xl font-bold text-sky-500">
                        {reg.avg_discount_pct}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">O&apos;rtacha g&apos;olib</p>
                      <p className="font-medium">
                        {formatAmount(reg.avg_winning_amount)} UZS
                      </p>
                    </div>
                  </div>
                  <Progress value={reg.avg_discount_pct} className="h-1.5 mt-2" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {statsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !myHistory || myHistory.summary.total_bids === 0 ? (
            <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
              <div className="py-8 text-center text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Hali taklif tarixi yo&apos;q</p>
                <p className="text-sm mt-1">
                  Tenderga ariza berganingizda va narx ko&apos;rsatganingizda bu yerda ko&apos;rinadi
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg hover:scale-[1.02] text-center">
                  <p className="text-sm text-muted-foreground">Jami takliflar</p>
                  <p className="text-2xl font-bold mt-1">{myHistory.summary.total_bids}</p>
                </div>
                <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg hover:scale-[1.02] text-center">
                  <p className="text-sm text-muted-foreground">Yutilgan</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {myHistory.summary.wins}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg hover:scale-[1.02] text-center">
                  <p className="text-sm text-muted-foreground">Yutish foizi</p>
                  <p className="text-2xl font-bold text-sky-500 mt-1">
                    {myHistory.summary.win_rate}%
                  </p>
                </div>
                <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg hover:scale-[1.02] text-center">
                  <p className="text-sm text-muted-foreground">Yutish chegirmasi</p>
                  <p className="text-2xl font-bold mt-1">
                    {myHistory.summary.avg_win_discount
                      ? `${myHistory.summary.avg_win_discount}%`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
                <h3 className="text-sm font-medium mb-4">Taklif tarixi</h3>
                <div className="space-y-2">
                  {myHistory.bids.map((bid, i) => (
                    <div
                      key={`${bid.tender_id}-${i}`}
                      className="flex items-center justify-between p-3 rounded-xl border border-black/5 bg-white/40 backdrop-blur transition-all hover:bg-white/70 hover:shadow-sm dark:border-white/5 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {bid.title}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {bid.category && (
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" /> {bid.category}
                            </span>
                          )}
                          <span>
                            Tender: {formatAmount(bid.tender_amount)} UZS
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium">
                          {formatAmount(bid.bid_amount)} UZS
                        </p>
                        <div className="flex items-center gap-2 justify-end mt-1">
                          <span className="text-xs text-muted-foreground">
                            -{bid.discount_pct}%
                          </span>
                          {bid.result === "won" ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-[12px] font-semibold dark:bg-green-900/40 dark:text-green-300">
                              <Trophy className="h-3 w-3 mr-1" /> Yutildi
                            </span>
                          ) : bid.result === "lost" ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-[12px] font-semibold dark:bg-red-900/40 dark:text-red-300">
                              <XCircle className="h-3 w-3 mr-1" /> Yutqazildi
                            </span>
                          ) : (
                            <span className="rounded-full border border-black/10 bg-white/70 backdrop-blur px-2.5 py-0.5 text-[12px] font-semibold dark:border-white/10 dark:bg-white/5">
                              {bid.stage}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
