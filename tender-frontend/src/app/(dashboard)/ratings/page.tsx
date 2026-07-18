"use client";

import { useEffect, useState } from "react";
import { Star, Building2, Trophy, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

interface Rating {
  id: number;
  company_id: number;
  company_name: string | null;
  stir: string | null;
  category: string;
  score: number;
  grade: string;
  wins: number;
  losses: number;
  total_bids: number;
  total_contract_amount: number;
  region: string | null;
}

interface RatingStats { total_rated: number; by_grade: Record<string, number>; by_category: Record<string, number>; }

const gradeColors: Record<string, string> = {
  A: "bg-green-500/10 text-green-600 dark:text-green-400",
  BBB: "bg-sky-400/10 text-sky-500 dark:text-sky-400",
  BB: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  B: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  CCC: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  CC: "bg-red-500/10 text-red-600 dark:text-red-400",
  D: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

const gradeDotColors: Record<string, string> = {
  A: "bg-green-500",
  BBB: "bg-sky-400",
  BB: "bg-cyan-500",
  B: "bg-yellow-500",
  CCC: "bg-orange-500",
  CC: "bg-red-500",
  D: "bg-slate-500",
};

export default function RatingsPage() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("");
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    Promise.all([
      api.get("/v1/ratings"),
      api.get("/v1/ratings/stats"),
      api.get("/v1/ratings/categories"),
    ]).then(([r, s, c]) => {
      setRatings(r.data.data);
      setStats(s.data.data);
      setCategories(c.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const filterByCategory = async (cat: string) => {
    setCategory(cat);
    const params: Record<string, string> = {};
    if (cat) params.category = cat;
    const r = await api.get("/v1/ratings", { params });
    setRatings(r.data.data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Tashkilotlar reytingi</h1>
        <p className="text-[14px] text-muted-foreground mt-1">Kompaniyalar reytingi ball va kategoriya bo&apos;yicha</p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg hover:scale-[1.01]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400/10 to-sky-500/20 dark:from-sky-400/20 dark:to-sky-400/30">
                <Building2 className="h-5 w-5 text-sky-500 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{stats.total_rated}</p>
                <p className="text-[12px] text-muted-foreground">Jami baholangan</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg hover:scale-[1.01]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/20 dark:from-green-400/20 dark:to-green-500/30">
                <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{stats.by_grade?.A || 0}</p>
                <p className="text-[12px] text-muted-foreground">&quot;A&quot; reytingli</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg hover:scale-[1.01]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/20 dark:from-purple-400/20 dark:to-purple-500/30">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{Object.keys(stats.by_category).length}</p>
                <p className="text-[12px] text-muted-foreground">Kategoriya</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all active:scale-[0.97] ${
            !category
              ? "bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] shadow-sm"
              : "border border-black/10 bg-white/70 backdrop-blur hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5"
          }`}
          onClick={() => filterByCategory("")}
        >
          Barchasi
        </button>
        {categories.map((c) => (
          <button
            key={c.name}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all active:scale-[0.97] ${
              category === c.name
                ? "bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] shadow-sm"
                : "border border-black/10 bg-white/70 backdrop-blur hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5"
            }`}
            onClick={() => filterByCategory(c.name)}
          >
            {c.name} ({c.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : ratings.length === 0 ? (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl py-16 text-center dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
          <Star className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Reytinglar topilmadi</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl overflow-hidden dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5 bg-white/40 dark:bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Tashkilot</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Kategoriya</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Hudud</th>
                  <th className="px-4 py-3 text-center text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Reyting</th>
                  <th className="px-4 py-3 text-center text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Ball</th>
                  <th className="px-4 py-3 text-center text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">G&apos;alabalar</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((r, i) => (
                  <tr key={r.id} className="border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-white/50 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3.5 font-medium text-muted-foreground text-[13px]">{i + 1}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-[13px]">{r.company_name || "Noma'lum"}</p>
                      {r.stir && <p className="text-[11px] text-muted-foreground mt-0.5">STIR: {r.stir}</p>}
                    </td>
                    <td className="px-4 py-3.5 text-[13px]">{r.category}</td>
                    <td className="px-4 py-3.5 text-[13px] text-muted-foreground">{r.region || "—"}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${gradeColors[r.grade] || gradeColors.D}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${gradeDotColors[r.grade] || gradeDotColors.D}`} />
                        {r.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-semibold text-[13px]">{r.score.toFixed(1)}</td>
                    <td className="px-4 py-3.5 text-center text-[13px]">
                      <span className="text-green-600 dark:text-green-400 font-semibold">{r.wins}</span>
                      <span className="text-muted-foreground mx-1">/</span>
                      <span className="text-red-500 dark:text-red-400 font-semibold">{r.losses}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
