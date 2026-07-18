"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Target, Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

import api from "@/lib/api";
import {
  formatAmount,
  formatDate,
  getCategoryLabel,
  getRegionLabel,
  getStatusColor,
  getStatusLabel,
} from "@/lib/format";

interface MatchedTender {
  id: number;
  tender_id: number;
  title: string;
  organization: string | null;
  category: string | null;
  region: string | null;
  status: string;
  amount: number | null;
  currency: string;
  deadline: string | null;
  match_score: number;
  is_saved: boolean;
}

export default function MatchedTendersPage() {
  const [tenders, setTenders] = useState<MatchedTender[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(0);

  const fetchMatched = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/v1/tenders/matched/", {
        params: { page, per_page: 20, min_score: minScore },
      });
      setTenders(data.data);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    } catch {
      setTenders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, minScore]);

  useEffect(() => {
    fetchMatched();
  }, [fetchMatched]);

  const toggleSave = async (matchId: number, index: number) => {
    try {
      const { data } = await api.post(`/v1/tenders/save/${matchId}`);
      setTenders((prev) =>
        prev.map((t, i) =>
          i === index ? { ...t, is_saved: data.data.is_saved } : t
        )
      );
      toast.success(data.data.is_saved ? "Saqlandi" : "Olib tashlandi");
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-400";
  };

  const statusDotColor = (status: string) => {
    const label = getStatusColor(status);
    if (label === "destructive") return { bg: "bg-red-500", text: "text-red-600", pill: "bg-red-500/10" };
    if (label === "default") return { bg: "bg-green-500", text: "text-green-600", pill: "bg-green-500/10" };
    if (label === "secondary") return { bg: "bg-sky-400", text: "text-sky-500", pill: "bg-sky-400/10" };
    return { bg: "bg-gray-400", text: "text-gray-600", pill: "bg-gray-400/10" };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em] flex items-center gap-2">
          <Target className="h-7 w-7" />
          Mos tenderlar
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Kompaniyangizga mos keladigan tenderlar ({total} ta topildi)
        </p>
      </div>

      {/* Score filter - glassmorphism */}
      <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
        <div className="mb-1">
          <h3 className="text-[16px] font-semibold tracking-tight">Minimal moslik bali</h3>
          <p className="text-[14px] text-muted-foreground">
            Faqat {minScore}% va undan yuqori moslik ko&apos;rsatiladi
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <span className="text-[13px] font-medium w-8 text-muted-foreground">0%</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={minScore}
            onChange={(e) => {
              setMinScore(Number(e.target.value));
              setPage(1);
            }}
            className="flex-1 accent-sky-400"
          />
          <span className="text-[13px] font-semibold w-12 text-right">{minScore}%</span>
        </div>
      </div>

      {/* Tender list */}
      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : tenders.length === 0 ? (
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
            <div className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-lg font-semibold">Mos tenderlar topilmadi</p>
              <p className="text-[14px] text-muted-foreground mt-1">
                Kompaniya profilingizni to&apos;ldiring yoki moslik balini kamaytiring
              </p>
              <Link href="/company">
                <button className="mt-4 rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5">
                  Kompaniya profilini to&apos;ldirish
                </button>
              </Link>
            </div>
          </div>
        ) : (
          tenders.map((tender, index) => {
            const sc = statusDotColor(tender.status);
            return (
              <div
                key={tender.id}
                className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg hover:scale-[1.003] hover:bg-white/80 dark:hover:bg-[rgba(17,24,39,0.7)] group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Score circle */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div
                        className={`text-2xl font-bold tabular-nums ${getScoreColor(
                          tender.match_score
                        )}`}
                      >
                        {Math.round(tender.match_score)}%
                      </div>
                      <div className="w-14 h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getScoreBg(tender.match_score)} transition-all`}
                          style={{ width: `${tender.match_score}%` }}
                        />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/tenders/${tender.tender_id ?? tender.id}`}
                        className="hover:underline"
                      >
                        <h3 className="font-semibold leading-tight line-clamp-2 text-[16px] group-hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
                          {tender.title}
                        </h3>
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-[14px] text-muted-foreground mt-1.5">
                        <span>{tender.organization ?? "—"}</span>
                        <span className="opacity-40">&bull;</span>
                        <span>{getCategoryLabel(tender.category)}</span>
                        <span className="opacity-40">&bull;</span>
                        <span>{getRegionLabel(tender.region)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-semibold text-[16px]">
                        {formatAmount(tender.amount)}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {formatDate(tender.deadline)}
                      </p>
                    </div>
                    {/* Status pill with dot */}
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${sc.pill} ${sc.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sc.bg}`} />
                      {getStatusLabel(tender.status)}
                    </span>
                    {/* Save button */}
                    <button
                      className="rounded-xl p-2 transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.04] active:scale-[0.92]"
                      onClick={() => toggleSave(tender.id, index)}
                    >
                      {tender.is_saved ? (
                        <BookmarkCheck className="h-4 w-4 text-sky-500" />
                      ) : (
                        <Bookmark className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5 disabled:opacity-40 disabled:pointer-events-none"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Oldingi
          </button>
          <span className="text-[13px] text-muted-foreground tabular-nums px-3">
            {page} / {totalPages}
          </span>
          <button
            className="rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5 disabled:opacity-40 disabled:pointer-events-none"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Keyingi
          </button>
        </div>
      )}
    </div>
  );
}
