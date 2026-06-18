"use client";

import { useState } from "react";
import {
  FileText,
  Upload,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  FileCheck,
  Loader2,
  Shield,
  Lightbulb,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import api from "@/lib/api";

interface Requirement {
  name: string;
  name_uz: string;
  found: boolean;
  required: boolean;
  category: string;
  matches: string[];
}

interface MissingItem {
  name: string;
  name_uz: string;
  category: string;
}

interface CheckResult {
  filename: string;
  total_pages: number;
  word_count: number;
  completeness_pct: number;
  risk_level: string;
  found_required: number;
  total_required: number;
  found_optional: number;
  total_optional: number;
  requirements: Requirement[];
  missing_required: MissingItem[];
  missing_optional: MissingItem[];
  dates_found: string[];
  amounts_found: string[];
  tips: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  legal: "Huquqiy hujjatlar",
  financial: "Moliyaviy hujjatlar",
  proposal: "Taklif hujjatlari",
  documents: "Umumiy hujjatlar",
  qualification: "Malaka hujjatlari",
  dates: "Muddatlar",
  terms: "Shartlar",
};

const RISK_CONFIG: Record<string, { color: string; label: string }> = {
  past: { color: "text-green-600", label: "Past xavf" },
  "o'rta": { color: "text-yellow-600", label: "O'rta xavf" },
  yuqori: { color: "text-red-600", label: "Yuqori xavf" },
};

export default function DocumentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [expandedReqs, setExpandedReqs] = useState<Set<string>>(new Set());

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Faqat PDF fayllar qabul qilinadi");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Fayl hajmi 10 MB dan oshmasligi kerak");
      return;
    }
    setFile(f);
    setCheckResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleCheck = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/v1/documents/check", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCheckResult(data.data);
      toast.success("Hujjat muvaffaqiyatli tekshirildi!");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? String(
              (err as { response?: { data?: { error?: string; detail?: string } } })
                .response?.data?.error ??
              (err as { response?: { data?: { detail?: string } } })
                .response?.data?.detail ??
              "Tekshirishda xatolik"
            )
          : "Tekshirishda xatolik";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleReq = (name: string) => {
    setExpandedReqs((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const groupedRequirements = checkResult
    ? Object.entries(
        checkResult.requirements.reduce(
          (acc, req) => {
            if (!acc[req.category]) acc[req.category] = [];
            acc[req.category].push(req);
            return acc;
          },
          {} as Record<string, Requirement[]>
        )
      )
    : [];

  const riskInfo = checkResult
    ? RISK_CONFIG[checkResult.risk_level] || RISK_CONFIG["o'rta"]
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Hujjat tekshiruvi
        </h1>
        <p className="text-muted-foreground">
          Tender hujjatini yuklang — talablar avtomatik tekshiriladi
        </p>
      </div>

      {/* Upload area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">
              PDF faylni bu yerga tashlang
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              yoki tugmani bosib tanlang (max 10 MB)
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => document.getElementById("doc-file-input")?.click()}
              >
                Fayl tanlash
              </Button>
              {file && (
                <Button onClick={handleCheck} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Tekshirilmoqda...
                    </>
                  ) : (
                    <>
                      <FileCheck className="mr-2 h-4 w-4" />
                      Tekshirish
                    </>
                  )}
                </Button>
              )}
            </div>
            <input
              id="doc-file-input"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />
            {file && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <FileText className="h-4 w-4 text-red-500" />
                <span className="font-medium">{file.name}</span>
                <span className="text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {checkResult && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-muted-foreground">Tugallanganlik</p>
                <p className="text-3xl font-bold text-primary">
                  {checkResult.completeness_pct}%
                </p>
                <Progress value={checkResult.completeness_pct} className="h-2 mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-muted-foreground">Xavf darajasi</p>
                {riskInfo && (
                  <div className={`flex items-center justify-center gap-2 mt-1 ${riskInfo.color}`}>
                    {checkResult.risk_level === "past" ? (
                      <Shield className="h-5 w-5" />
                    ) : checkResult.risk_level === "yuqori" ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                    <p className="text-xl font-bold">{riskInfo.label}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-muted-foreground">Majburiy talablar</p>
                <p className="text-2xl font-bold">
                  <span className="text-green-600">{checkResult.found_required}</span>
                  <span className="text-muted-foreground text-lg">
                    {" "}
                    / {checkResult.total_required}
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-muted-foreground">Hujjat</p>
                <p className="text-lg font-bold">{checkResult.total_pages} sahifa</p>
                <p className="text-xs text-muted-foreground">
                  {checkResult.word_count.toLocaleString()} so&apos;z
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tips */}
          {checkResult.tips.length > 0 && (
            <Card className="border-blue-200 dark:border-blue-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  Maslahatlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {checkResult.tips.map((tip, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Missing required */}
          {checkResult.missing_required.length > 0 && (
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  Topilmagan majburiy talablar ({checkResult.missing_required.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {checkResult.missing_required.map((item) => (
                    <Badge key={item.name} variant="destructive" className="text-xs">
                      {item.name_uz}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Requirements by category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Batafsil tekshiruv natijalari
              </CardTitle>
              <CardDescription>{checkResult.filename}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupedRequirements.map(([category, reqs]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    {CATEGORY_LABELS[category] || category}
                  </h3>
                  <div className="space-y-1">
                    {reqs.map((req) => (
                      <div key={req.name}>
                        <div
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() =>
                            req.matches.length > 0 && toggleReq(req.name)
                          }
                        >
                          <div className="flex items-center gap-2">
                            {req.found ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400" />
                            )}
                            <span className="text-sm">{req.name_uz}</span>
                            {req.required && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1"
                              >
                                Majburiy
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {req.found ? (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                Topildi
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Topilmadi
                              </Badge>
                            )}
                            {req.matches.length > 0 &&
                              (expandedReqs.has(req.name) ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ))}
                          </div>
                        </div>
                        {expandedReqs.has(req.name) &&
                          req.matches.length > 0 && (
                            <div className="ml-8 mb-2 space-y-1">
                              {req.matches.map((match, i) => (
                                <p
                                  key={i}
                                  className="text-xs text-muted-foreground bg-muted/50 rounded p-2"
                                >
                                  {match}
                                </p>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                  <Separator className="mt-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Dates and amounts */}
          <div className="grid gap-4 md:grid-cols-2">
            {checkResult.dates_found.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Topilgan sanalar ({checkResult.dates_found.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {checkResult.dates_found.map((date, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {date}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {checkResult.amounts_found.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Topilgan summalar ({checkResult.amounts_found.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {checkResult.amounts_found.map((amount, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {amount}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
