"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Columns3,
  Search,
  X,
  Plus,
  Loader2,
  ExternalLink,
  Building2,
  MapPin,
  Tag,
  Calendar,
  Banknote,
  FileText,
  Phone,

} from "lucide-react";
import api from "@/lib/api";
import { formatAmount } from "@/lib/format";
import { CATEGORIES, REGIONS } from "@/types";

interface CompareTender {
  id: number;
  title: string;
  organization: string | null;
  category: string | null;
  region: string | null;
  status: string;
  amount: number | null;
  currency: string;
  deadline: string | null;
  published_at: string | null;
  requirements: string | null;
  contact_info: string | null;
  url: string | null;
  description: string | null;
}

interface TenderListItem {
  id: number;
  title: string;
  organization: string | null;
  category: string | null;
  region: string | null;
  amount: number | null;
  currency: string;
  status: string;
  deadline: string | null;
  description: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: "Faol", color: "bg-green-500/10 text-green-600" },
  closed: { label: "Yopilgan", color: "bg-gray-500/10 text-gray-600" },
  cancelled: { label: "Bekor", color: "bg-red-500/10 text-red-600" },
  awarded: { label: "G'olib aniqlangan", color: "bg-sky-400/10 text-sky-500" },
};

const COMPARE_FIELDS: { key: keyof CompareTender; label: string; icon: React.ElementType; format?: (v: unknown) => string }[] = [
  { key: "organization", label: "Tashkilot", icon: Building2 },
  { key: "category", label: "Kategoriya", icon: Tag, format: (v) => CATEGORIES.find((c) => c.value === v)?.label ?? String(v ?? "—") },
  { key: "region", label: "Viloyat", icon: MapPin, format: (v) => REGIONS.find((r) => r.value === v)?.label ?? String(v ?? "—") },
  { key: "status", label: "Status", icon: Tag, format: (v) => STATUS_MAP[v as string]?.label ?? String(v) },
  { key: "amount", label: "Summa", icon: Banknote, format: (v) => v ? formatAmount(Number(v)) : "—" },
  { key: "deadline", label: "Muddat", icon: Calendar, format: (v) => v ? new Date(v as string).toLocaleDateString("uz-UZ") : "—" },
  { key: "published_at", label: "E'lon qilingan", icon: Calendar, format: (v) => v ? new Date(v as string).toLocaleDateString("uz-UZ") : "—" },
  { key: "contact_info", label: "Aloqa", icon: Phone },
  { key: "requirements", label: "Talablar", icon: FileText },
  { key: "description", label: "Tavsif", icon: FileText },
];

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedTenders, setSelectedTenders] = useState<TenderListItem[]>([]);
  const [compareTenders, setCompareTenders] = useState<CompareTender[]>([]);
  const [loading, setLoading] = useState(false);

  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [allTenders, setAllTenders] = useState<TenderListItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const fetchAllTenders = useCallback(async () => {
    setLoadingList(true);
    try {
      const params: Record<string, string> = { per_page: "50" };
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      if (searchQuery.length >= 2) params.search = searchQuery;
      const { data: res } = await api.get("/v1/tenders/", { params });
      setAllTenders(res.data ?? []);
    } catch {
      setAllTenders([]);
    } finally {
      setLoadingList(false);
    }
  }, [filterCategory, filterStatus, searchQuery]);

  useEffect(() => {
    if (showPicker) {
      const timer = setTimeout(() => fetchAllTenders(), 300);
      return () => clearTimeout(timer);
    }
  }, [showPicker, fetchAllTenders]);

  const fetchCompare = useCallback(async (ids: number[]) => {
    if (ids.length < 2) {
      setCompareTenders([]);
      return;
    }
    setLoading(true);
    try {
      const { data: res } = await api.get("/v1/tenders/compare/", {
        params: { ids: ids.join(",") },
      });
      setCompareTenders(res.data);
    } catch {
      setCompareTenders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedIds.length >= 2) fetchCompare(selectedIds);
    else setCompareTenders([]);
  }, [selectedIds, fetchCompare]);

  const addTender = (tender: TenderListItem) => {
    if (selectedIds.length >= 4 || selectedIds.includes(tender.id)) return;
    setSelectedIds((prev) => [...prev, tender.id]);
    setSelectedTenders((prev) => [...prev, tender]);
  };

  const removeTender = (id: number) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    setSelectedTenders((prev) => prev.filter((x) => x.id !== id));
  };

  const availableTenders = allTenders.filter((t) => !selectedIds.includes(t.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em] flex items-center gap-2">
          <Columns3 className="h-6 w-6" />
          Tender taqqoslash
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          2 dan 4 gacha tenderni yonma-yon solishtiring
        </p>
      </div>

      {/* Selected tenders */}
      <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[16px] font-bold">Tanlangan tenderlar</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {selectedIds.length}/4 tender tanlandi
            </p>
          </div>
          {selectedIds.length < 4 && (
            <button
              className={`rounded-xl px-4 py-2 text-[13px] font-semibold transition-all gap-1.5 inline-flex items-center ${
                showPicker
                  ? "bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f]"
                  : "border border-black/10 bg-white/70 backdrop-blur hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5"
              }`}
              onClick={() => setShowPicker(!showPicker)}
            >
              <Plus className="h-3.5 w-3.5" />
              Tender qo&apos;shish
            </button>
          )}
        </div>

        {selectedTenders.length === 0 ? (
          <p className="text-[13px] text-muted-foreground text-center py-4">
            Hali tender tanlanmagan
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {selectedTenders.map((t) => (
              <div
                key={t.id}
                className="relative rounded-xl border border-black/[0.06] bg-white/80 p-4 dark:bg-white/[0.03] dark:border-white/[0.06] group transition-all hover:shadow-sm"
              >
                <button
                  onClick={() => removeTender(t.id)}
                  className="absolute top-3 right-3 h-6 w-6 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <p className="text-[14px] font-semibold leading-tight pr-8 line-clamp-2">{t.title}</p>
                <p className="text-[12px] text-muted-foreground mt-1.5 truncate">{t.organization ?? "—"}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_MAP[t.status]?.color ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_MAP[t.status]?.label ?? t.status}
                  </span>
                  <span className="text-[12px] font-bold">{t.amount ? formatAmount(t.amount) : "—"}</span>
                </div>
                {t.description && (
                  <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">{t.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tender picker */}
      {showPicker && (
        <div className="rounded-2xl border border-sky-400/20 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-sky-400/10 transition-all shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-bold">Tender tanlang</h3>
            <button
              onClick={() => setShowPicker(false)}
              className="h-8 w-8 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center hover:bg-black/[0.08] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="w-full h-10 rounded-xl border border-black/10 bg-white/80 pl-9 pr-4 text-[13px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tender qidirish..."
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-10 rounded-xl border border-black/10 bg-white/80 px-3 text-[12px] font-medium outline-none focus:border-sky-400 dark:bg-white/5 dark:border-white/10 appearance-none cursor-pointer"
              >
                <option value="">Barcha kategoriyalar</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 rounded-xl border border-black/10 bg-white/80 px-3 text-[12px] font-medium outline-none focus:border-sky-400 dark:bg-white/5 dark:border-white/10 appearance-none cursor-pointer"
              >
                <option value="">Barcha holatlar</option>
                <option value="active">Faol</option>
                <option value="closed">Yopilgan</option>
              </select>
            </div>
          </div>

          {/* Tender list */}
          {loadingList ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : availableTenders.length === 0 ? (
            <p className="text-[13px] text-muted-foreground text-center py-8">
              {searchQuery || filterCategory || filterStatus ? "Qidiruv bo'yicha tender topilmadi" : "Tenderlar mavjud emas"}
            </p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {availableTenders.map((t) => (
                <button
                  key={t.id}
                  onClick={() => addTender(t)}
                  className="w-full text-left rounded-xl border border-black/[0.04] bg-white/60 p-4 transition-all hover:bg-sky-50/50 hover:border-sky-400/20 hover:shadow-sm dark:bg-white/[0.02] dark:border-white/[0.04] dark:hover:bg-sky-400/5 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold leading-tight group-hover:text-sky-500 dark:hover:text-sky-400 transition-colors">{t.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 truncate">{t.organization ?? "—"}</p>
                      {t.description && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{t.description}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[12px] font-bold">{t.amount ? formatAmount(t.amount) : "—"}</p>
                      <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_MAP[t.status]?.color ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_MAP[t.status]?.label ?? t.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {t.category && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Tag className="h-2.5 w-2.5" />
                        {CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}
                      </span>
                    )}
                    {t.region && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {REGIONS.find((r) => r.value === t.region)?.label ?? t.region}
                      </span>
                    )}
                    {t.deadline && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {new Date(t.deadline).toLocaleDateString("uz-UZ")}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comparison table */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && compareTenders.length >= 2 && (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-black/[0.1] dark:border-white/[0.1] bg-muted/60">
                  <th className="text-left p-4 font-semibold text-muted-foreground w-40 shrink-0 border-r border-black/[0.06] dark:border-white/[0.06]">
                    Maydon
                  </th>
                  {compareTenders.map((t, colIdx) => (
                    <th key={t.id} className={`text-left p-4 min-w-[220px] ${colIdx < compareTenders.length - 1 ? "border-r border-black/[0.04] dark:border-white/[0.04]" : ""}`}>
                      <div className="space-y-1">
                        <Link
                          href={`/tenders/${t.id}`}
                          className="font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          {t.title.slice(0, 50)}{t.title.length > 50 ? "..." : ""}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </Link>
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_MAP[t.status]?.color ?? "bg-gray-100 text-gray-600"}`}>
                          {STATUS_MAP[t.status]?.label ?? t.status}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {COMPARE_FIELDS.map((field, idx) => {
                  const values = compareTenders.map((t) => t[field.key]);
                  const allSame = values.every((v) => String(v ?? "") === String(values[0] ?? ""));
                  const isEven = idx % 2 === 0;

                  return (
                    <tr key={field.key} className={`border-b border-black/[0.08] dark:border-white/[0.06] last:border-0 transition-colors hover:bg-sky-50/40 dark:hover:bg-sky-400/5 ${isEven ? "bg-muted/30 dark:bg-white/[0.02]" : ""}`}>
                      <td className="p-4 font-semibold text-muted-foreground whitespace-nowrap border-r border-black/[0.06] dark:border-white/[0.06]">
                        <span className="flex items-center gap-2">
                          <field.icon className="h-3.5 w-3.5" />
                          {field.label}
                        </span>
                      </td>
                      {compareTenders.map((t, colIdx) => {
                        const raw = t[field.key];
                        const display = field.format
                          ? field.format(raw)
                          : (raw ?? "—");
                        const isDiff = !allSame && raw !== null;

                        return (
                          <td
                            key={t.id}
                            className={`p-4 ${colIdx < compareTenders.length - 1 ? "border-r border-black/[0.04] dark:border-white/[0.04]" : ""} ${isDiff ? "bg-yellow-50/60 dark:bg-yellow-950/20" : ""}`}
                          >
                            <span className={`${field.key === "description" || field.key === "requirements" ? "line-clamp-4 text-xs leading-relaxed" : ""}`}>
                              {String(display || "—")}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && selectedIds.length > 0 && selectedIds.length < 2 && !showPicker && (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-8 text-center text-muted-foreground dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
          Taqqoslash uchun yana kamida 1 ta tender qo&apos;shing
        </div>
      )}

      {!loading && selectedIds.length === 0 && !showPicker && (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-8 text-center text-muted-foreground dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
          Yuqoridagi &quot;Tender qo&apos;shish&quot; tugmasini bosib tenderlarni tanlang
        </div>
      )}
    </div>
  );
}
