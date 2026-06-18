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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
          <Button variant="ghost" size="icon" onClick={() => setProfile(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{profile.name}</h1>
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
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <s.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-bold">{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* By category */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Kategoriya bo&apos;yicha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.by_category.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q</p>
              ) : (
                profile.by_category.map((c) => (
                  <div key={c.category} className="flex items-center justify-between">
                    <span className="text-sm">{c.category}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{c.count} ta</Badge>
                      <span className="text-xs text-muted-foreground">{fmt(c.amount)} UZS</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* By region */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Viloyat bo&apos;yicha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.by_region.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q</p>
              ) : (
                profile.by_region.map((r) => (
                  <div key={r.region} className="flex items-center justify-between">
                    <span className="text-sm">{r.region}</span>
                    <Badge variant="secondary">{r.count} ta</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent wins */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">So&apos;nggi g&apos;alabalar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6" />
          Raqobatchi tahlili
        </h1>
        <p className="text-muted-foreground">
          Tender g&apos;oliblarini tahlil qiling — kim qayerda yutadi
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListFilter className="h-4 w-4" />
            Filtrlar
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              <Button variant="ghost" size="sm" onClick={() => { setCategory(""); setRegion(""); }}>
                Tozalash
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top competitors table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Top raqobatchilar
          </CardTitle>
          <CardDescription>G&apos;alabalar soni bo&apos;yicha</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : competitors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ma&apos;lumot topilmadi
            </p>
          ) : (
            <div className="space-y-2">
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
                          <Badge variant="default">{c.wins} g&apos;alaba</Badge>
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
        </CardContent>
      </Card>
    </div>
  );
}
