"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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

interface SearchResult {
  id: number;
  title: string;
  organization: string | null;
  amount: number | null;
  status: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Faol", variant: "default" },
  closed: { label: "Yopilgan", variant: "secondary" },
  cancelled: { label: "Bekor", variant: "destructive" },
  awarded: { label: "G'olib aniqlangan", variant: "outline" },
};

const COMPARE_FIELDS: { key: keyof CompareTender; label: string; icon: React.ElementType; format?: (v: unknown) => string }[] = [
  { key: "organization", label: "Tashkilot", icon: Building2 },
  { key: "category", label: "Kategoriya", icon: Tag },
  { key: "region", label: "Viloyat", icon: MapPin },
  { key: "status", label: "Status", icon: Tag, format: (v) => STATUS_MAP[v as string]?.label ?? String(v) },
  { key: "amount", label: "Summa", icon: Banknote, format: (v) => v ? `${Number(v).toLocaleString("uz-UZ")} UZS` : "—" },
  { key: "deadline", label: "Muddat", icon: Calendar, format: (v) => v ? new Date(v as string).toLocaleDateString("uz-UZ") : "—" },
  { key: "published_at", label: "E'lon qilingan", icon: Calendar, format: (v) => v ? new Date(v as string).toLocaleDateString("uz-UZ") : "—" },
  { key: "contact_info", label: "Aloqa", icon: Phone },
  { key: "requirements", label: "Talablar", icon: FileText },
  { key: "description", label: "Tavsif", icon: FileText },
];

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [tenders, setTenders] = useState<CompareTender[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const fetchCompare = useCallback(async (ids: number[]) => {
    if (ids.length < 2) {
      setTenders([]);
      return;
    }
    setLoading(true);
    try {
      const { data: res } = await api.get("/v1/tenders/compare/", {
        params: { ids: ids.join(",") },
      });
      setTenders(res.data);
    } catch {
      setTenders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedIds.length >= 2) {
      fetchCompare(selectedIds);
    } else {
      setTenders([]);
    }
  }, [selectedIds, fetchCompare]);

  const searchTenders = async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data: res } = await api.get("/v1/tenders/search/", {
        params: { q, per_page: 10 },
      });
      setSearchResults(
        (res.data as SearchResult[]).filter((t) => !selectedIds.includes(t.id))
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchTenders(searchQuery), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const addTender = (id: number) => {
    if (selectedIds.length >= 4 || selectedIds.includes(id)) return;
    setSelectedIds((prev) => [...prev, id]);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  const removeTender = (id: number) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Columns3 className="h-6 w-6" />
          Tender taqqoslash
        </h1>
        <p className="text-muted-foreground">
          2 dan 4 gacha tenderni yonma-yon solishtiring
        </p>
      </div>

      {/* Tender selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tenderlarni tanlang</CardTitle>
          <CardDescription>
            Taqqoslash uchun kamida 2 ta tender qo&apos;shing ({selectedIds.length}/4)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Selected chips */}
          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id) => {
              const t = tenders.find((x) => x.id === id);
              return (
                <Badge key={id} variant="secondary" className="gap-1 py-1 px-2 text-xs">
                  #{id} {t ? `— ${t.title.slice(0, 30)}...` : ""}
                  <button onClick={() => removeTender(id)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}

            {selectedIds.length < 4 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Plus className="h-3 w-3" />
                Tender qo&apos;shish
              </Button>
            )}
          </div>

          {/* Search */}
          {showSearch && (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tender nomini yozing..."
                  className="pl-9"
                  autoFocus
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border bg-popover shadow-lg max-h-64 overflow-y-auto">
                  {searchResults.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => addTender(t.id)}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors border-b last:border-0"
                    >
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        #{t.id} &middot; {t.organization ?? "—"} &middot;{" "}
                        {t.amount ? `${t.amount.toLocaleString("uz-UZ")} UZS` : "—"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison table */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && tenders.length >= 2 && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              {/* Header — tender titles */}
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground w-40 shrink-0">
                    Maydon
                  </th>
                  {tenders.map((t) => (
                    <th key={t.id} className="text-left p-4 min-w-[220px]">
                      <div className="space-y-1">
                        <Link
                          href={`/tenders/${t.id}`}
                          className="font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          {t.title.slice(0, 50)}{t.title.length > 50 ? "..." : ""}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </Link>
                        <Badge variant={STATUS_MAP[t.status]?.variant ?? "secondary"} className="text-[10px]">
                          {STATUS_MAP[t.status]?.label ?? t.status}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {COMPARE_FIELDS.map((field) => {
                  const values = tenders.map((t) => t[field.key]);
                  const allSame = values.every((v) => String(v ?? "") === String(values[0] ?? ""));

                  return (
                    <tr key={field.key} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4 font-medium text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-2">
                          <field.icon className="h-3.5 w-3.5" />
                          {field.label}
                        </span>
                      </td>
                      {tenders.map((t) => {
                        const raw = t[field.key];
                        const display = field.format
                          ? field.format(raw)
                          : (raw ?? "—");
                        const isDiff = !allSame && raw !== null;

                        return (
                          <td
                            key={t.id}
                            className={`p-4 ${isDiff ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}`}
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
          </CardContent>
        </Card>
      )}

      {!loading && selectedIds.length > 0 && selectedIds.length < 2 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Taqqoslash uchun kamida 2 ta tender tanlang
          </CardContent>
        </Card>
      )}

      {!loading && selectedIds.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Yuqoridagi &quot;Tender qo&apos;shish&quot; tugmasini bosib tenderlarn tanlang
          </CardContent>
        </Card>
      )}
    </div>
  );
}
