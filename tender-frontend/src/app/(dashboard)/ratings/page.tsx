"use client";

import { useEffect, useState } from "react";
import { Star, Search, Filter, Building2, Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  A: "bg-green-100 text-green-700 border-green-200",
  BBB: "bg-blue-100 text-blue-700 border-blue-200",
  BB: "bg-cyan-100 text-cyan-700 border-cyan-200",
  B: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CCC: "bg-orange-100 text-orange-700 border-orange-200",
  CC: "bg-red-100 text-red-700 border-red-200",
  D: "bg-slate-100 text-slate-700 border-slate-200",
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
    const params: any = {};
    if (cat) params.category = cat;
    const r = await api.get("/v1/ratings", { params });
    setRatings(r.data.data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tashkilotlar reytingi</h1>
        <p className="text-muted-foreground">Kompaniyalar reytingi ball va kategoriya bo'yicha</p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_rated}</p>
                <p className="text-xs text-muted-foreground">Jami baholangan</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.by_grade?.A || 0}</p>
                <p className="text-xs text-muted-foreground">"A" reytingli</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Object.keys(stats.by_category).length}</p>
                <p className="text-xs text-muted-foreground">Kategoriya</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge variant={!category ? "default" : "outline"} className="cursor-pointer" onClick={() => filterByCategory("")}>
          Barchasi
        </Badge>
        {categories.map((c) => (
          <Badge key={c.name} variant={category === c.name ? "default" : "outline"} className="cursor-pointer" onClick={() => filterByCategory(c.name)}>
            {c.name} ({c.count})
          </Badge>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : ratings.length === 0 ? (
        <Card className="py-16 text-center">
          <Star className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Reytinglar topilmadi</p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium">Tashkilot</th>
                  <th className="px-4 py-3 text-left font-medium">Kategoriya</th>
                  <th className="px-4 py-3 text-left font-medium">Hudud</th>
                  <th className="px-4 py-3 text-center font-medium">Reyting</th>
                  <th className="px-4 py-3 text-center font-medium">Ball</th>
                  <th className="px-4 py-3 text-center font-medium">G'alabalar</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((r, i) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.company_name || "Noma'lum"}</p>
                      {r.stir && <p className="text-xs text-muted-foreground">STIR: {r.stir}</p>}
                    </td>
                    <td className="px-4 py-3">{r.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.region || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={gradeColors[r.grade] || gradeColors.D}>{r.grade}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{r.score.toFixed(1)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-green-600">{r.wins}</span>
                      <span className="text-muted-foreground"> / </span>
                      <span className="text-red-500">{r.losses}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
