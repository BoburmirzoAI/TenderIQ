"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Search, Filter, X, Bookmark, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
import { CATEGORIES, REGIONS, TENDER_STATUSES } from "@/types";
import type { Tender, PaginatedResponse } from "@/types";

export default function TendersPage() {
  const searchParams = useSearchParams();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");

  const [savedSearches, setSavedSearches] = useState<{ id: number; name: string; filters: Record<string, string | null> }[]>([]);
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [savingSearch, setSavingSearch] = useState(false);

  const fetchTenders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("per_page", "20");
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (region) params.set("region", region);
      if (status) params.set("status", status);

      const { data } = await api.get<PaginatedResponse<Tender>>(
        `/v1/tenders/?${params}`
      );
      setTenders(data.data);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, region, status]);

  useEffect(() => {
    fetchTenders();
  }, [fetchTenders]);

  useEffect(() => {
    api.get("/v1/saved-searches/").then(({ data }) => {
      setSavedSearches(data.data);
    }).catch(() => {});
  }, []);

  const handleSaveSearch = async () => {
    if (!saveName.trim()) return;
    setSavingSearch(true);
    try {
      const { data: res } = await api.post("/v1/saved-searches/", {
        name: saveName.trim(),
        filters: { search: search || null, category: category || null, region: region || null, status: status || null },
      });
      setSavedSearches((prev) => [res.data, ...prev]);
      setSaveName("");
      setShowSaveInput(false);
      toast.success("Qidiruv saqlandi");
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setSavingSearch(false);
    }
  };

  const applySavedSearch = (filters: Record<string, string | null>) => {
    setSearch(filters.search ?? "");
    setCategory(filters.category ?? "");
    setRegion(filters.region ?? "");
    setStatus(filters.status ?? "");
    setPage(1);
  };

  const deleteSavedSearch = async (id: number) => {
    try {
      await api.delete(`/v1/saved-searches/${id}`);
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
      toast.success("O'chirildi");
    } catch {
      toast.error("Xatolik");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setRegion("");
    setStatus("");
    setPage(1);
  };

  const hasFilters = search || category || region || status;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenderlar</h1>
          <p className="text-muted-foreground">
            Jami {total} ta tender topildi
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filtrlar
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filtrlar</CardTitle>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Tozalash
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Qidirish..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(!v || v === "all" ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategoriya" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={region}
                onValueChange={(v) => {
                  setRegion(!v || v === "all" ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Viloyat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha viloyatlar</SelectItem>
                  {REGIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(!v || v === "all" ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Holat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha holatlar</SelectItem>
                  {TENDER_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Qidiruvni saqlash</span>
              {hasFilters && !showSaveInput && (
                <Button variant="ghost" size="sm" onClick={() => setShowSaveInput(true)}>
                  <Bookmark className="h-3.5 w-3.5 mr-1" />
                  Saqlash
                </Button>
              )}
            </div>
            {showSaveInput && (
              <div className="flex gap-2">
                <Input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Qidiruv nomi..."
                  className="flex-1"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveSearch()}
                />
                <Button size="sm" onClick={handleSaveSearch} disabled={savingSearch || !saveName.trim()}>
                  {savingSearch ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Saqlash"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowSaveInput(false); setSaveName(""); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {savedSearches.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {savedSearches.map((s) => (
                  <div key={s.id} className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs">
                    <Star className="h-3 w-3 text-amber-500" />
                    <button
                      onClick={() => applySavedSearch(s.filters)}
                      className="hover:text-primary font-medium"
                    >
                      {s.name}
                    </button>
                    <button
                      onClick={() => deleteSavedSearch(s.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : tenders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium">Tenderlar topilmadi</p>
              <p className="text-sm text-muted-foreground">
                Filtrlarni o&apos;zgartiring yoki keyinroq qaytib keling
              </p>
            </CardContent>
          </Card>
        ) : (
          tenders.map((tender) => (
            <Link key={tender.id} href={`/tenders/${tender.id}`}>
              <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="font-medium leading-tight line-clamp-2">
                        {tender.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{tender.organization ?? "—"}</span>
                        <span>&bull;</span>
                        <span>{getCategoryLabel(tender.category)}</span>
                        <span>&bull;</span>
                        <span>{getRegionLabel(tender.region)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="font-semibold text-sm">
                        {formatAmount(tender.amount)}
                      </span>
                      <Badge variant={getStatusColor(tender.status)}>
                        {getStatusLabel(tender.status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Muddat: {formatDate(tender.deadline)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
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
