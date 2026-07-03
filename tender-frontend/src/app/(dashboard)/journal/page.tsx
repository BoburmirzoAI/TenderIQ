"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  XCircle,
  Clock,
  Loader2,
  TrendingUp,
  BarChart3,
  Building2,
  Tag,
  Ban,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface JournalEntry {
  id: number;
  tender_id: number;
  tender_title: string;
  organization: string | null;
  category: string | null;
  region: string | null;
  tender_amount: number | null;
  bid_amount: number | null;
  currency: string;
  stage: string;
  result: string | null;
  priority: string;
  notes: string | null;
  win_probability: number | null;
  submitted_at: string | null;
  decided_at: string | null;
  created_at: string | null;
}

interface JournalStats {
  total: number;
  won: number;
  lost: number;
  cancelled: number;
  pending: number;
  win_rate: number;
  avg_bid: number;
  total_won_amount: number;
  by_category: { category: string; total: number; won: number; lost: number; win_rate: number }[];
  by_region: { region: string; total: number; won: number; lost: number; win_rate: number }[];
  monthly: { month: string; total: number; won: number; lost: number; win_rate: number }[];
}

const RESULT_CONFIG: Record<string, { label: string; color: string; icon: typeof Trophy }> = {
  won: { label: "Yutildi", color: "bg-green-100 text-green-800", icon: Trophy },
  lost: { label: "Yutqazildi", color: "bg-red-100 text-red-800", icon: XCircle },
  cancelled: { label: "Bekor qilindi", color: "bg-gray-100 text-gray-800", icon: Ban },
};

function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} mlrd`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} mln`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} ming`;
  return amount.toFixed(0);
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: 20 };
      if (resultFilter !== "all") params.result = resultFilter;
      const res = await api.get("/v1/journal/entries", { params });
      setEntries(res.data.data || []);
      const msg = res.data.message || "";
      const pagesMatch = msg.match(/pages:(\d+)/);
      if (pagesMatch) setTotalPages(parseInt(pagesMatch[1]) || 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, resultFilter]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get("/v1/journal/stats");
      setStats(res.data.data || {
        total: 0, won: 0, lost: 0, cancelled: 0, pending: 0,
        win_rate: 0, avg_bid: 0, total_won_amount: 0,
        by_category: [], by_region: [], monthly: [],
      });
    } catch {
      setStats({
        total: 0, won: 0, lost: 0, cancelled: 0, pending: 0,
        win_rate: 0, avg_bid: 0, total_won_amount: 0,
        by_category: [], by_region: [], monthly: [],
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const updateResult = async (entryId: number, result: "won" | "lost" | "cancelled") => {
    setUpdatingId(entryId);
    try {
      await api.patch(`/v1/journal/entries/${entryId}`, { result });
      toast.success("Natija yangilandi");
      loadEntries();
      loadStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Xatolik");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Win/Loss kundalik</h1>
        <p className="text-muted-foreground">
          Tender arizalaringiz natijalari va tahlili
        </p>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">Jami</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">Yutilgan</p>
              <p className="text-2xl font-bold text-green-600">{stats.won}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">Yutqazilgan</p>
              <p className="text-2xl font-bold text-red-600">{stats.lost}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">Win rate</p>
              <p className="text-2xl font-bold text-blue-600">{stats.win_rate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">Yutilgan summa</p>
              <p className="text-2xl font-bold">{formatAmount(stats.total_won_amount)}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries">Kundalik</TabsTrigger>
          <TabsTrigger value="analytics">Tahlil</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          {/* Filter */}
          <div className="flex gap-3">
            <Select value={resultFilter} onValueChange={(v) => { setResultFilter(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Natija" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="won">Yutilgan</SelectItem>
                <SelectItem value="lost">Yutqazilgan</SelectItem>
                <SelectItem value="cancelled">Bekor qilingan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Hali kundalikda yozuv yo&apos;q</p>
                <p className="text-sm mt-1">Pipeline orqali arizalar qo&apos;shing</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-2">
                {entries.map((entry) => {
                  const config = entry.result ? RESULT_CONFIG[entry.result] : null;
                  const ResultIcon = config?.icon || Clock;
                  return (
                    <Card key={entry.id}>
                      <CardContent className="py-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">
                                {entry.tender_title}
                              </p>
                              {entry.result ? (
                                <Badge className={config?.color}>
                                  <ResultIcon className="h-3 w-3 mr-1" />
                                  {config?.label}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Kutilmoqda
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {entry.stage}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                              {entry.organization && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" /> {entry.organization}
                                </span>
                              )}
                              {entry.category && (
                                <span className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" /> {entry.category}
                                </span>
                              )}
                              {entry.region && (
                                <span>{entry.region}</span>
                              )}
                              {entry.created_at && (
                                <span>{new Date(entry.created_at).toLocaleDateString("uz")}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right text-sm">
                              {entry.bid_amount != null && (
                                <p className="font-medium">
                                  Taklif: {formatAmount(entry.bid_amount)} {entry.currency}
                                </p>
                              )}
                              {entry.tender_amount != null && (
                                <p className="text-xs text-muted-foreground">
                                  Tender: {formatAmount(entry.tender_amount)} {entry.currency}
                                </p>
                              )}
                            </div>

                            {!entry.result && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:bg-green-50 h-7 px-2 text-xs"
                                  disabled={updatingId === entry.id}
                                  onClick={() => updateResult(entry.id, "won")}
                                >
                                  {updatingId === entry.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <><Trophy className="h-3 w-3 mr-1" />Won</>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50 h-7 px-2 text-xs"
                                  disabled={updatingId === entry.id}
                                  onClick={() => updateResult(entry.id, "lost")}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />Lost
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {statsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !stats || stats.total === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Tahlil uchun ma&apos;lumot yo&apos;q</p>
                <p className="text-sm mt-1">
                  Pipeline orqali arizalar qo&apos;shing va natijalarni belgilang
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Monthly Trend */}
              {stats.monthly.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Oylik trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.monthly.map((m) => {
                        const maxBar = Math.max(...stats.monthly.map((x) => x.total), 1);
                        return (
                          <div key={m.month} className="flex items-center gap-3 text-sm">
                            <span className="w-16 text-muted-foreground font-mono text-xs">
                              {m.month}
                            </span>
                            <div className="flex-1 flex items-center gap-1 h-5">
                              <div
                                className="h-full bg-green-500 rounded-l"
                                style={{ width: `${(m.won / maxBar) * 100}%` }}
                              />
                              <div
                                className="h-full bg-red-400"
                                style={{ width: `${(m.lost / maxBar) * 100}%` }}
                              />
                              <div
                                className="h-full bg-gray-300 rounded-r"
                                style={{
                                  width: `${((m.total - m.won - m.lost) / maxBar) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="w-10 text-right text-xs font-medium">
                              {m.win_rate}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-500" /> Yutilgan
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-red-400" /> Yutqazilgan
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-gray-300" /> Boshqa
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                {/* By Category */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Kategoriya bo&apos;yicha
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.by_category.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Ma&apos;lumot yo&apos;q
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {stats.by_category.map((c) => (
                          <div key={c.category} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="truncate">{c.category}</span>
                              <span className="font-medium ml-2">{c.win_rate}%</span>
                            </div>
                            <div className="flex gap-1 h-2">
                              <div
                                className="bg-green-500 rounded-l"
                                style={{ width: `${(c.won / c.total) * 100}%` }}
                              />
                              <div
                                className="bg-red-400 rounded-r"
                                style={{ width: `${(c.lost / c.total) * 100}%` }}
                              />
                            </div>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              <span>{c.won} yutilgan</span>
                              <span>{c.lost} yutqazilgan</span>
                              <span>{c.total} jami</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* By Region */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Hudud bo&apos;yicha
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.by_region.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Ma&apos;lumot yo&apos;q
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {stats.by_region.map((r) => (
                          <div key={r.region} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="truncate">{r.region}</span>
                              <span className="font-medium ml-2">{r.win_rate}%</span>
                            </div>
                            <div className="flex gap-1 h-2">
                              <div
                                className="bg-green-500 rounded-l"
                                style={{ width: `${(r.won / r.total) * 100}%` }}
                              />
                              <div
                                className="bg-red-400 rounded-r"
                                style={{ width: `${(r.lost / r.total) * 100}%` }}
                              />
                            </div>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              <span>{r.won} yutilgan</span>
                              <span>{r.lost} yutqazilgan</span>
                              <span>{r.total} jami</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
