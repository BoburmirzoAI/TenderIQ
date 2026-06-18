"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Target, Bookmark, BookmarkCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Target className="h-6 w-6" />
          Mos tenderlar
        </h1>
        <p className="text-muted-foreground">
          Kompaniyangizga mos keladigan tenderlar ({total} ta topildi)
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Minimal moslik bali</CardTitle>
          <CardDescription>
            Faqat {minScore}% va undan yuqori moslik ko&apos;rsatiladi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium w-8">0%</span>
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
              className="flex-1"
            />
            <span className="text-sm font-medium w-12">{minScore}%</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : tenders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-lg font-medium">Mos tenderlar topilmadi</p>
              <p className="text-sm text-muted-foreground">
                Kompaniya profilingizni to&apos;ldiring yoki moslik balini kamaytiring
              </p>
              <Link href="/company">
                <Button variant="outline" className="mt-4">
                  Kompaniya profilini to&apos;ldirish
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          tenders.map((tender, index) => (
            <Card
              key={tender.id}
              className="transition-colors hover:bg-muted/50"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div
                        className={`text-2xl font-bold ${getScoreColor(
                          tender.match_score
                        )}`}
                      >
                        {Math.round(tender.match_score)}%
                      </div>
                      <Progress
                        value={tender.match_score}
                        className="w-14 h-1.5"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/tenders/${tender.tender_id ?? tender.id}`}
                        className="hover:underline"
                      >
                        <h3 className="font-medium leading-tight line-clamp-2">
                          {tender.title}
                        </h3>
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{tender.organization ?? "—"}</span>
                        <span>&bull;</span>
                        <span>{getCategoryLabel(tender.category)}</span>
                        <span>&bull;</span>
                        <span>{getRegionLabel(tender.region)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {formatAmount(tender.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tender.deadline)}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(tender.status)}>
                      {getStatusLabel(tender.status)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleSave(tender.id, index)}
                    >
                      {tender.is_saved ? (
                        <BookmarkCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Oldingi
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
            Keyingi
          </Button>
        </div>
      )}
    </div>
  );
}
