"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Clock, MapPin, Building2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  "Asosiy sohangizga oid": "bg-blue-100 text-blue-700",
  "Qiziqishingizga asoslangan": "bg-purple-100 text-purple-700",
  "Yangi imkoniyat": "bg-green-100 text-green-700",
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
        <h1 className="text-2xl font-bold tracking-tight">AI tavsiyalar</h1>
        <p className="text-muted-foreground">
          Sun'iy intellekt sizga mos tenderlarni taklif qiladi
        </p>
      </div>

      {data && data.primary_category && (
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="flex items-center gap-4 p-4">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <div>
              <p className="font-medium">Asosiy sohangiz: <strong>{data.primary_category}</strong></p>
              <p className="text-sm text-muted-foreground">
                Taqsimot: {data.distribution.primary} asosiy | {data.distribution.secondary} qiziqish | {data.distribution.other} boshqa
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : !data || data.tenders.length === 0 ? (
        <Card className="py-16 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">
            Hozircha tavsiyalar yo'q. Kompaniya profilingizni to'ldiring va tenderlarni ko'rib chiqing.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.tenders.map((t) => (
            <Link key={t.id} href={`/tenders/${t.id}`}>
              <Card className="h-full transition-all hover:shadow-md hover:border-blue-200 cursor-pointer">
                <CardContent className="p-5">
                  <Badge className={reasonColors[t.recommendation_reason] || "bg-slate-100 text-slate-700"}>
                    {t.recommendation_reason}
                  </Badge>
                  <h3 className="mt-3 font-semibold leading-snug line-clamp-2">{t.title}</h3>
                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    {t.category && (
                      <p className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> {t.category}</p>
                    )}
                    {t.region && (
                      <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {t.region}</p>
                    )}
                    {t.amount && (
                      <p className="font-medium text-foreground">{formatAmount(t.amount)} {t.currency}</p>
                    )}
                    {t.deadline && (
                      <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {new Date(t.deadline).toLocaleDateString("uz")}</p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100 mr-3">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${Math.round(t.relevance_score * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-blue-600">{Math.round(t.relevance_score * 100)}%</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
