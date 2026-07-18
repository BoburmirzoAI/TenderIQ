"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Clock, MapPin, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAmount } from "@/lib/format";
import api from "@/lib/api";

interface Recommendation {
  id: number;
  title: string;
  category: string | null;
  region: string | null;
  amount: number | null;
  currency: string;
  deadline: string | null;
  source: string;
  recommendation_reason: string;
  relevance_score: number;
}

interface RecommendationData {
  total: number;
  primary_category: string | null;
  distribution: Record<string, string>;
  tenders: Recommendation[];
}

const reasonColors: Record<string, string> = {
  "Asosiy sohangizga oid": "bg-sky-400/10 text-sky-500",
  "Qiziqishingizga asoslangan": "bg-purple-500/10 text-purple-600",
  "Yangi imkoniyat": "bg-green-500/10 text-green-600",
};

const reasonDotColors: Record<string, string> = {
  "Asosiy sohangizga oid": "bg-sky-400",
  "Qiziqishingizga asoslangan": "bg-purple-500",
  "Yangi imkoniyat": "bg-green-500",
};

export default function RecommendationsPage() {
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/v1/recommendations", { params: { limit: 30 } })
      .then((r) => setData(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">AI tavsiyalar</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Sun&apos;iy intellekt sizga mos tenderlarni taklif qiladi
        </p>
      </div>

      {data && data.primary_category && (
        <div className="rounded-2xl border border-sky-200/60 bg-gradient-to-r from-sky-50/80 to-sky-100/40 backdrop-blur-xl p-5 dark:from-sky-950/30 dark:to-sky-900/10 dark:border-sky-400/[0.15] transition-all hover:shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10">
              <Sparkles className="h-6 w-6 text-sky-500" />
            </div>
            <div>
              <p className="text-[15px] font-semibold">Asosiy sohangiz: <strong>{data.primary_category}</strong></p>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Taqsimot: {data.distribution.primary} asosiy | {data.distribution.secondary} qiziqish | {data.distribution.other} boshqa
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : !data || data.tenders.length === 0 ? (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
          <div className="flex flex-col items-center justify-center py-16">
            <Sparkles className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-[15px] font-semibold mt-2">Hozircha tavsiyalar yo&apos;q</p>
            <p className="text-[14px] text-muted-foreground mt-1">
              Kompaniya profilingizni to&apos;ldiring va tenderlarni ko&apos;rib chiqing.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.tenders.map((t) => (
            <Link key={t.id} href={`/tenders/${t.id}`}>
              <div className="h-full rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg hover:scale-[1.01] hover:border-sky-200/60 dark:hover:border-sky-400/20 cursor-pointer group">
                {/* Reason pill */}
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${reasonColors[t.recommendation_reason] || "bg-slate-500/10 text-slate-600"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${reasonDotColors[t.recommendation_reason] || "bg-slate-400"}`} />
                  {t.recommendation_reason}
                </span>

                <h3 className="mt-3 font-semibold leading-snug line-clamp-2 text-[15px] group-hover:text-sky-500 dark:hover:text-sky-400 transition-colors">{t.title}</h3>

                <div className="mt-3 space-y-1.5 text-[13px] text-muted-foreground">
                  {t.category && (
                    <p className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 opacity-60" /> {t.category}</p>
                  )}
                  {t.region && (
                    <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 opacity-60" /> {t.region}</p>
                  )}
                  {t.amount && (
                    <p className="font-semibold text-foreground">{formatAmount(t.amount)} {t.currency}</p>
                  )}
                  {t.deadline && (
                    <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 opacity-60" /> {new Date(t.deadline).toLocaleDateString("uz")}</p>
                  )}
                </div>

                {/* Score bar */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-1.5 flex-1 rounded-full bg-black/[0.06] dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all"
                      style={{ width: `${Math.round(t.relevance_score * 100)}%` }}
                    />
                  </div>
                  <span className="text-[12px] font-semibold text-sky-500 dark:text-sky-400 tabular-nums">{Math.round(t.relevance_score * 100)}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
