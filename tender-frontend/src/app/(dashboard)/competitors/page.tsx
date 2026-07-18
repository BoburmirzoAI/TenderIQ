"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Trophy,
  TrendingDown,
  ArrowLeft,
  Loader2,
  MapPin,
  Tag,
  Building2,
  ListFilter,
} from "lucide-react";
import api from "@/lib/api";
import { CATEGORIES, REGIONS } from "@/types";

interface Competitor {
  name: string;
  stir: string | null;
  wins: number;
  total_amount: number;
  avg_amount: number;
}

interface CompetitorProfile {
  stir: string;
  name: string;
  wins: number;
  total_amount: number;
  avg_amount: number;
  min_amount: number | null;
  max_amount: number | null;
  avg_discount_pct: number | null;
  by_category: { category: string; count: number; amount: number }[];
  by_region: { region: string; count: number }[];
  recent_wins: {
    tender_id: number;
    title: string;
    category: string | null;
    region: string | null;
    winning_amount: number | null;
    tender_amount: number | null;
    discount_pct: number | null;
    deadline: string | null;
  }[];
}

function fmt(n: number) {
  return n.toLocaleString("uz-UZ", { maximumFractionDigits: 0 });
}

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");

  const [profile, setProfile] = useState<CompetitorProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchTop = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (category) params.category = category;
      if (region) params.region = region;
      const { data: res } = await api.get("/v1/competitors/top", { params });
      setCompetitors(res.data);
    } catch {
      setCompetitors([]);
    } finally {
      setLoading(false);
    }
  }, [category, region]);

  useEffect(() => {
    fetchTop();
  }, [fetchTop]);

  const openProfile = async (stir: string) => {
    if (!stir) return;
    setProfileLoading(true);
    try {
      const { data: res } = await api.get(`/v1/competitors/profile/${stir}`);
      setProfile(res.data);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  if (profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button className="rounded-xl border border-black/10 bg-white/70 backdrop-blur px-2 py-2 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5" onClick={() => setProfile(null)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">STIR: {profile.stir}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "G'alabalar", value: profile.wins, icon: Trophy },
            { label: "Jami summa", value: `${fmt(profile.total_amount)} UZS`, icon: Building2 },
            { label: "O'rtacha", value: `${fmt(profile.avg_amount)} UZS`, icon: TrendingDown },
            { label: "O'rtacha chegirma", value: profile.avg_discount_pct != null ? `${profile.avg_discount_pct}%` : "—", icon: TrendingDown },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <s.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-bold">{s.value}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* By category */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <div className="pb-3">
              <h3 className="text-[16px] font-bold mb-1 text-base flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Kategoriya bo&apos;yicha
              </h3>
            </div>
            <div className="space-y-3">
              {profile.by_category.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q</p>
              ) : (
                profile.by_category.map((c) => (
                  <div key={c.category} className="flex items-center justify-between">
                    <span className="text-sm">{c.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 text-[12px] font-semibold">{c.count} ta</span>
                      <span className="text-xs text-muted-foreground">{fmt(c.amount)} UZS</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* By region */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <div className="pb-3">
              <h3 className="text-[16px] font-bold mb-1 text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Viloyat bo&apos;yicha
              </h3>
            </div>
            <div className="space-y-3">
              {profile.by_region.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q</p>
              ) : (
                profile.by_region.map((r) => (
                  <div key={r.region} className="flex items-center justify-between">
                    <span className="text-sm">{r.region}</span>
                    <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 text-[12px] font-semibold">{r.count} ta</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent wins */}
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <div className="pb-3">
            <h3 className="text-[16px] font-bold mb-1 text-base">So&apos;nggi g&apos;alabalar</h3>
          </div>
          <div className="space-y-3">
            {profile.recent_wins.map((w) => (
              <div
                key={w.tender_id}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium line-clamp-1">{w.title}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                    {w.category && <span>{w.category}</span>}
                    {w.region && <span>&middot; {w.region}</span>}
                    {w.deadline && (
                      <span>&middot; {new Date(w.deadline).toLocaleDateString("uz-UZ")}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {w.winning_amount && (
                    <p className="text-sm font-semibold text-green-600">
                      {fmt(w.winning_amount)} UZS
                    </p>
                  )}
                  {w.discount_pct != null && (
                    <p className="text-[10px] text-muted-foreground">
                      -{w.discount_pct}% chegirma
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em] flex items-center gap-2">
          <Users className="h-6 w-6" />
          Raqobatchi tahlili
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tender g&apos;oliblarini tahlil qiling — kim qayerda yutadi
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
        <div className="pb-3">
          <h3 className="text-[16px] font-bold mb-1 text-base flex items-center gap-2">
            <ListFilter className="h-4 w-4" />
            Filtrlar
          </h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select
            value={category}
            onValueChange={(v) => setCategory(!v || v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
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

          {(category || region) && (
            <button className="rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5" onClick={() => { setCategory(""); setRegion(""); }}>
              Tozalash
            </button>
          )}
        </div>
      </div>

      {/* Top competitors table */}
      <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
        <div className="pb-3">
          <h3 className="text-[16px] font-bold mb-1 text-base flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Top raqobatchilar
          </h3>
          <p className="text-[13px] text-muted-foreground mb-4">G&apos;alabalar soni bo&apos;yicha</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : competitors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Ma&apos;lumot topilmadi
          </p>
        ) : (
          <div className="space-y-3">
            {competitors.map((c, i) => {
              const maxWins = competitors[0]?.wins || 1;
              return (
                <button
                  key={c.stir ?? c.name}
                  onClick={() => c.stir && openProfile(c.stir)}
                  disabled={!c.stir || profileLoading}
                  className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-8 text-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <span className="rounded-full bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] px-2.5 py-0.5 text-[12px] font-semibold">{c.wins} g&apos;alaba</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {c.stir ? `STIR: ${c.stir}` : "STIR noma'lum"}
                        </span>
                        <span className="text-xs font-medium">
                          O&apos;rtacha: {fmt(c.avg_amount)} UZS
                        </span>
                      </div>
                      <Progress value={(c.wins / maxWins) * 100} className="mt-2 h-1.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
