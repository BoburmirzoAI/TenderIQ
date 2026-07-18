"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Search, SlidersHorizontal, X, Bookmark, Star, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import {
  formatAmount,
  formatDate,
  getCategoryLabel,
  getRegionLabel,
  getStatusLabel,
} from "@/lib/format";
import { CATEGORIES, REGIONS, TENDER_STATUSES } from "@/types";
import type { Tender, PaginatedResponse } from "@/types";

const statusDot: Record<string, string> = {
  active: "bg-green-500",
  closed: "bg-gray-400",
  cancelled: "bg-red-400",
  draft: "bg-yellow-400",
};

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
  const activeFilterCount = [search, category, region, status].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Tenderlar</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            Jami <span className="font-semibold text-foreground">{total}</span> ta tender topildi
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-all ${
            showFilters
              ? "border-sky-200 bg-sky-50 text-sky-500 dark:border-sky-400/30 dark:bg-sky-400/10"
              : "border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/5"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtrlar
          {activeFilterCount > 0 && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white px-1">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[13px] font-semibold">Filtrlar</span>
            {hasFilters && (
              <button onClick={clearFilters} className="text-[12px] font-medium text-sky-500 dark:text-sky-400 hover:text-sky-600">
                Tozalash
              </button>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Qidirish..."
                className="apple-input !h-10 !pl-10 !text-[13px] !rounded-[10px]"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={category} onValueChange={(v) => { setCategory(!v || v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-10 rounded-[10px] border-black/10 text-[13px] dark:border-white/10">
                <SelectValue placeholder="Kategoriya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha kategoriyalar</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={region} onValueChange={(v) => { setRegion(!v || v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-10 rounded-[10px] border-black/10 text-[13px] dark:border-white/10">
                <SelectValue placeholder="Viloyat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha viloyatlar</SelectItem>
                {REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(!v || v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-10 rounded-[10px] border-black/10 text-[13px] dark:border-white/10">
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holatlar</SelectItem>
                {TENDER_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Saved searches */}
          <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted-foreground">Saqlangan qidiruvlar</span>
              {hasFilters && !showSaveInput && (
                <button onClick={() => setShowSaveInput(true)} className="text-[12px] font-medium text-sky-500 dark:text-sky-400 hover:text-sky-600 flex items-center gap-1">
                  <Bookmark className="h-3 w-3" /> Saqlash
                </button>
              )}
            </div>
            {showSaveInput && (
              <div className="flex gap-2 mt-2">
                <input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Qidiruv nomi..."
                  className="apple-input !h-8 !text-[12px] !rounded-lg"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveSearch()}
                />
                <button
                  onClick={handleSaveSearch}
                  disabled={savingSearch || !saveName.trim()}
                  className="rounded-full bg-[#1d1d1f] text-white px-4 h-8 text-[12px] font-semibold disabled:opacity-40 hover:bg-[#333] transition-colors"
                >
                  {savingSearch ? <Loader2 className="h-3 w-3 animate-spin" /> : "Saqlash"}
                </button>
                <button onClick={() => { setShowSaveInput(false); setSaveName(""); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {savedSearches.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {savedSearches.map((s) => (
                  <div key={s.id} className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/80 px-3 py-1 text-[11px] font-medium dark:border-white/10 dark:bg-white/5">
                    <Star className="h-2.5 w-2.5 text-amber-500" />
                    <button onClick={() => applySavedSearch(s.filters)} className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
                      {s.name}
                    </button>
                    <button onClick={() => deleteSavedSearch(s.id)} className="ml-0.5 text-muted-foreground hover:text-red-500 transition-colors">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tender list */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : tenders.length === 0 ? (
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-16 text-center dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
            <div className="h-14 w-14 rounded-full bg-black/5 flex items-center justify-center mb-4 mx-auto dark:bg-white/5">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-[17px] font-semibold">Tenderlar topilmadi</p>
            <p className="text-[14px] text-muted-foreground mt-1">
              Filtrlarni o&apos;zgartiring yoki keyinroq qaytib keling
            </p>
          </div>
        ) : (
          tenders.map((tender) => (
            <Link key={tender.id} href={`/tenders/${tender.id}`} className="block">
              <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl px-6 py-5 transition-all hover:shadow-lg hover:scale-[1.003] hover:bg-white/80 group dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] dark:hover:bg-[rgba(17,24,39,0.7)]">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
                        <span className={`h-2 w-2 rounded-full ${statusDot[tender.status] || "bg-gray-400"}`} />
                        {getStatusLabel(tender.status)}
                      </span>
                      <span className="text-[12px] font-medium text-muted-foreground rounded-full bg-black/[0.04] px-2.5 py-0.5 dark:bg-white/[0.06]">
                        {getCategoryLabel(tender.category)}
                      </span>
                    </div>
                    <h3 className="text-[16px] font-semibold leading-snug line-clamp-1 group-hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
                      {tender.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                      <span>{tender.organization ?? "—"}</span>
                      <span>{getRegionLabel(tender.region)}</span>
                      <span>Muddat: {formatDate(tender.deadline)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[18px] font-bold tracking-tight">
                      {formatAmount(tender.amount)}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {tender.currency || "UZS"}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 text-sm transition-all hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed dark:border-white/10 dark:bg-white/5"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-4 text-[13px] font-medium text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 text-sm transition-all hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed dark:border-white/10 dark:bg-white/5"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
