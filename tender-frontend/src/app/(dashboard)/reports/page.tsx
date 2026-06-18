"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
      // silently fail — user sees no download
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hisobotlar</h1>
        <p className="text-muted-foreground">
          PDF yoki Excel formatida hisobotlarni yuklab oling
        </p>
      </div>

      {/* Filters for tenders report */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListFilter className="h-4 w-4" />
            Tenderlar filtri
          </CardTitle>
          <CardDescription>
            Tenderlar hisobotiga qo&apos;llaniladigan filtrlar
          </CardDescription>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategory("");
                  setRegion("");
                  setStatus("");
                }}
              >
                Tozalash
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Report cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORT_CARDS.map((report) => {
          const Icon = report.icon;
          const pdfKey = `${report.type}-pdf`;
          const excelKey = `${report.type}-excel`;

          return (
            <Card key={report.type} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-5 w-5 text-primary" />
                  {report.title}
                </CardTitle>
                <CardDescription>{report.description}</CardDescription>
                {report.hasFilters && (category || region || status) && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {category && (
                      <Badge variant="secondary" className="text-[10px]">
                        {CATEGORIES.find((c) => c.value === category)?.label}
                      </Badge>
                    )}
                    {region && (
                      <Badge variant="secondary" className="text-[10px]">
                        {REGIONS.find((r) => r.value === region)?.label}
                      </Badge>
                    )}
                    {status && (
                      <Badge variant="secondary" className="text-[10px]">
                        {status}
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    disabled={loading !== null}
                    onClick={() => download(report.type, "pdf")}
                  >
                    {loading === pdfKey ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={loading !== null}
                    onClick={() => download(report.type, "excel")}
                  >
                    {loading === excelKey ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4" />
                    )}
                    Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
