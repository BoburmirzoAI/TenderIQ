"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Kanban,
  ListFilter,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { CATEGORIES, REGIONS } from "@/types";
import { toast } from "sonner";

type ReportType = "tenders" | "applications" | "analytics";
type ReportFormat = "pdf" | "excel";

const REPORT_CARDS: {
  type: ReportType;
  title: string;
  description: string;
  icon: React.ElementType;
  hasFilters: boolean;
}[] = [
  {
    type: "tenders",
    title: "Tenderlar hisoboti",
    description: "Barcha tenderlar ro'yxati — filtrlab yuklab olish mumkin",
    icon: FileText,
    hasFilters: true,
  },
  {
    type: "applications",
    title: "Arizalar hisoboti",
    description: "Pipeline bo'yicha arizalar holati va statistikasi",
    icon: Kanban,
    hasFilters: false,
  },
  {
    type: "analytics",
    title: "Analitika hisoboti",
    description: "Bozor tahlili, kategoriya va viloyat statistikasi",
    icon: BarChart3,
    hasFilters: false,
  },
];

export default function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");

  async function download(type: ReportType, format: ReportFormat) {
    const key = `${type}-${format}`;
    setLoading(key);
    try {
      const params: Record<string, string> = { format };
      if (type === "tenders") {
        if (category) params.category = category;
        if (region) params.region = region;
        if (status) params.status = status;
      }

      const response = await api.get(`/v1/reports/${type}`, {
        params,
        responseType: "blob",
      });

      const ext = format === "pdf" ? "pdf" : "xlsx";
      const filename =
        response.headers["content-disposition"]
          ?.match(/filename="?([^"]+)"?/)?.[1] ?? `${type}_report.${ext}`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Hisobotni yuklab olishda xatolik yuz berdi");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Hisobotlar</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          PDF yoki Excel formatida hisobotlarni yuklab oling
        </p>
      </div>

      {/* Filters for tenders report */}
      <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold flex items-center gap-2">
            <ListFilter className="h-4 w-4" />
            Tenderlar filtri
          </h3>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Tenderlar hisobotiga qo&apos;llaniladigan filtrlar
          </p>
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

          <Select
            value={status}
            onValueChange={(v) => setStatus(!v || v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="active">Faol</SelectItem>
              <SelectItem value="closed">Yopilgan</SelectItem>
              <SelectItem value="cancelled">Bekor qilingan</SelectItem>
              <SelectItem value="awarded">G&apos;olib aniqlangan</SelectItem>
            </SelectContent>
          </Select>

          {(category || region || status) && (
            <button
              className="rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5"
              onClick={() => {
                setCategory("");
                setRegion("");
                setStatus("");
              }}
            >
              Tozalash
            </button>
          )}
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />

      {/* Report cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORT_CARDS.map((report) => {
          const Icon = report.icon;
          const pdfKey = `${report.type}-pdf`;
          const excelKey = `${report.type}-excel`;

          return (
            <div
              key={report.type}
              className="flex flex-col rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg hover:scale-[1.01]"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400/10 to-purple-500/10 dark:from-sky-400/20 dark:to-purple-400/20">
                    <Icon className="h-5 w-5 text-sky-500 dark:text-sky-400" />
                  </div>
                  <h3 className="text-[15px] font-semibold">{report.title}</h3>
                </div>
                <p className="text-[14px] text-muted-foreground mt-1 mb-4">
                  {report.description}
                </p>
                {report.hasFilters && (category || region || status) && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {category && (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold bg-sky-400/10 text-sky-500 dark:text-sky-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        {CATEGORIES.find((c) => c.value === category)?.label}
                      </span>
                    )}
                    {region && (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                        {REGIONS.find((r) => r.value === region)?.label}
                      </span>
                    )}
                    {status && (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold bg-green-500/10 text-green-600 dark:text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        {status}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-auto">
                <button
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#1d1d1f] text-white px-6 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading !== null}
                  onClick={() => download(report.type, "pdf")}
                >
                  {loading === pdfKey ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  PDF
                </button>
                <button
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading !== null}
                  onClick={() => download(report.type, "excel")}
                >
                  {loading === excelKey ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  Excel
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
