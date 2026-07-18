"use client";

import { useState } from "react";
import {
  Brain,
  TrendingUp,
  Trophy,
  Info,
  Loader2,

  Shield,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Star,
  Zap,
  ShieldCheck,
  GitCompareArrows,
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,

  Line,

  XAxis,
  YAxis,
  CartesianGrid,


  Area,
  AreaChart,
  ComposedChart,

} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import api from "@/lib/api";
import { formatAmount } from "@/lib/format";
import { CATEGORIES, REGIONS } from "@/types";
import type { WinProbabilityResponse, OptimalBidResponse, RiskAssessmentResponse, TenderSimilarityResponse, TrendForecastResponse } from "@/types";


const riskColors: Record<string, string> = {
  past: "text-green-600 dark:text-green-400",
  "o'rta": "text-amber-600 dark:text-amber-400",
  yuqori: "text-red-600 dark:text-red-400",
};

const riskBgColors: Record<string, string> = {
  past: "bg-green-500/10 border-green-500/20",
  "o'rta": "bg-amber-500/10 border-amber-500/20",
  yuqori: "bg-red-500/10 border-red-500/20",
};

const riskIcons: Record<string, React.ReactNode> = {
  past: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  "o'rta": <AlertTriangle className="h-5 w-5 text-amber-500" />,
  yuqori: <Shield className="h-5 w-5 text-red-500" />,
};

const riskLabels: Record<string, string> = {
  past: "Past xavf",
  "o'rta": "O'rtacha xavf",
  yuqori: "Yuqori xavf",
};

export default function MLPage() {
  const [tfCategory, setTfCategory] = useState("");
  const [tfRegion, setTfRegion] = useState("");
  const [tfMonths, setTfMonths] = useState("6");
  const [tfLoading, setTfLoading] = useState(false);
  const [tfResult, setTfResult] = useState<TrendForecastResponse | null>(null);

  const [wpCategory, setWpCategory] = useState("");
  const [wpRegion, setWpRegion] = useState("");
  const [wpTenderAmount, setWpTenderAmount] = useState("");
  const [wpBidAmount, setWpBidAmount] = useState("");
  const [wpExperience, setWpExperience] = useState("");
  const [wpCategoryMatch, setWpCategoryMatch] = useState(false);
  const [wpRegionMatch, setWpRegionMatch] = useState(false);
  const [wpCompetitors, setWpCompetitors] = useState("5");
  const [wpDaysLeft, setWpDaysLeft] = useState("");
  const [wpPastWins, setWpPastWins] = useState("0");
  const [wpPredicting, setWpPredicting] = useState(false);
  const [wpResult, setWpResult] = useState<WinProbabilityResponse | null>(null);

  const [obCategory, setObCategory] = useState("");
  const [obRegion, setObRegion] = useState("");
  const [obTenderAmount, setObTenderAmount] = useState("");
  const [obExperience, setObExperience] = useState("");
  const [obCategoryMatch, setObCategoryMatch] = useState(false);
  const [obRegionMatch, setObRegionMatch] = useState(false);
  const [obCompetitors, setObCompetitors] = useState("5");
  const [obDaysLeft, setObDaysLeft] = useState("");
  const [obPastWins, setObPastWins] = useState("0");
  const [obPredicting, setObPredicting] = useState(false);
  const [obResult, setObResult] = useState<OptimalBidResponse | null>(null);

  const [raCategory, setRaCategory] = useState("");
  const [raRegion, setRaRegion] = useState("");
  const [raTenderAmount, setRaTenderAmount] = useState("");
  const [raAvgMarket, setRaAvgMarket] = useState("");
  const [raCompanyBudget, setRaCompanyBudget] = useState("");
  const [raExperience, setRaExperience] = useState("");
  const [raCategoryMatch, setRaCategoryMatch] = useState(false);
  const [raCompetitors, setRaCompetitors] = useState("5");
  const [raDaysLeft, setRaDaysLeft] = useState("");
  const [raActiveProjects, setRaActiveProjects] = useState("0");
  const [raRequiresLicense, setRaRequiresLicense] = useState(false);
  const [raRequiresGuarantee, setRaRequiresGuarantee] = useState(false);
  const [raDocCount, setRaDocCount] = useState("0");
  const [raPredicting, setRaPredicting] = useState(false);
  const [raResult, setRaResult] = useState<RiskAssessmentResponse | null>(null);

  const [tsaTitleA, setTsaTitleA] = useState("");
  const [tsaDescA, setTsaDescA] = useState("");
  const [tsaCatA, setTsaCatA] = useState("");
  const [tsaRegA, setTsaRegA] = useState("");
  const [tsaAmountA, setTsaAmountA] = useState("");
  const [tsaTitleB, setTsaTitleB] = useState("");
  const [tsaDescB, setTsaDescB] = useState("");
  const [tsaCatB, setTsaCatB] = useState("");
  const [tsaRegB, setTsaRegB] = useState("");
  const [tsaAmountB, setTsaAmountB] = useState("");
  const [tsaPredicting, setTsaPredicting] = useState(false);
  const [tsaResult, setTsaResult] = useState<TenderSimilarityResponse | null>(null);

  const handleTrendForecast = async () => {
    setTfLoading(true);
    try {
      const { data } = await api.post("/v1/ml/trend-forecast", {
        category: tfCategory || undefined,
        region: tfRegion || undefined,
        forecast_months: parseInt(tfMonths) || 6,
      });
      setTfResult(data.data);
      toast.success("Bozor prognozi tayyor!");
    } catch {
      toast.error("Prognoz qilishda xatolik");
    } finally {
      setTfLoading(false);
    }
  };

  const handleSimilarity = async () => {
    if (!tsaTitleA && !tsaDescA) {
      toast.error("Kamida birinchi tender sarlavhasini kiriting");
      return;
    }
    if (!tsaTitleB && !tsaDescB) {
      toast.error("Kamida ikkinchi tender sarlavhasini kiriting");
      return;
    }
    setTsaPredicting(true);
    try {
      const { data } = await api.post("/v1/ml/tender-similarity", {
        tender_a: {
          title: tsaTitleA,
          description: tsaDescA,
          category: tsaCatA,
          region: tsaRegA,
          amount: parseFloat(tsaAmountA) || 0,
        },
        tender_b: {
          title: tsaTitleB,
          description: tsaDescB,
          category: tsaCatB,
          region: tsaRegB,
          amount: parseFloat(tsaAmountB) || 0,
        },
      });
      setTsaResult(data.data);
      toast.success("Taqqoslash tayyor!");
    } catch {
      toast.error("Taqqoslashda xatolik");
    } finally {
      setTsaPredicting(false);
    }
  };

  const handleRiskAssess = async () => {
    if (!raCategory || !raRegion) {
      toast.error("Kategoriya va viloyatni tanlang");
      return;
    }
    setRaPredicting(true);
    try {
      const { data } = await api.post("/v1/ml/risk-assessment", {
        category: raCategory,
        region: raRegion,
        tender_amount: parseFloat(raTenderAmount) || 0,
        avg_market_amount: parseFloat(raAvgMarket) || 0,
        company_max_budget: parseFloat(raCompanyBudget) || 0,
        company_experience: parseInt(raExperience) || 0,
        category_match: raCategoryMatch,
        competitor_count: parseInt(raCompetitors) || 5,
        days_until_deadline: raDaysLeft ? parseInt(raDaysLeft) : undefined,
        active_projects: parseInt(raActiveProjects) || 0,
        requires_license: raRequiresLicense,
        requires_guarantee: raRequiresGuarantee,
        required_document_count: parseInt(raDocCount) || 0,
      });
      setRaResult(data.data);
      toast.success("Risk tahlili tayyor!");
    } catch {
      toast.error("Tahlil qilishda xatolik");
    } finally {
      setRaPredicting(false);
    }
  };

  const handleOptimalBid = async () => {
    if (!obCategory || !obRegion || !obTenderAmount) {
      toast.error("Kategoriya, viloyat va tender summasini kiriting");
      return;
    }
    setObPredicting(true);
    try {
      const { data } = await api.post("/v1/ml/optimal-bid", {
        category: obCategory,
        region: obRegion,
        tender_amount: parseFloat(obTenderAmount),
        company_experience: parseInt(obExperience) || 0,
        category_match: obCategoryMatch,
        region_match: obRegionMatch,
        competitor_count: parseInt(obCompetitors) || 5,
        days_until_deadline: obDaysLeft ? parseInt(obDaysLeft) : undefined,
        past_wins_category: parseInt(obPastWins) || 0,
      });
      setObResult(data.data);
      toast.success("Optimal narx hisoblandi!");
    } catch {
      toast.error("Hisoblashda xatolik");
    } finally {
      setObPredicting(false);
    }
  };

  const handleWinPredict = async () => {
    if (!wpCategory || !wpRegion) {
      toast.error("Kategoriya va viloyatni tanlang");
      return;
    }
    setWpPredicting(true);
    try {
      const { data } = await api.post("/v1/ml/win-probability", {
        category: wpCategory,
        region: wpRegion,
        tender_amount: parseFloat(wpTenderAmount) || 0,
        bid_amount: wpBidAmount ? parseFloat(wpBidAmount) : undefined,
        company_experience: parseInt(wpExperience) || 0,
        category_match: wpCategoryMatch,
        region_match: wpRegionMatch,
        competitor_count: parseInt(wpCompetitors) || 5,
        days_until_deadline: wpDaysLeft ? parseInt(wpDaysLeft) : undefined,
        past_wins_category: parseInt(wpPastWins) || 0,
      });
      setWpResult(data.data);
      toast.success("G'alaba ehtimoli hisoblandi!");
    } catch {
      toast.error("Hisoblashda xatolik");
    } finally {
      setWpPredicting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em] flex items-center gap-2">
          <Brain className="h-6 w-6" />
          AI tahlil markazi
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Sun&apos;iy intellekt yordamida tenderlarni tahlil qiling
        </p>
      </div>

      <Tabs defaultValue="win-probability" className="space-y-6">
        <TabsList>
          <TabsTrigger value="win-probability">
            <Trophy className="mr-1.5 h-4 w-4" />
            G&apos;alaba ehtimoli
          </TabsTrigger>
          <TabsTrigger value="risk-assessment">
            <Shield className="mr-1.5 h-4 w-4" />
            Risk tahlili
          </TabsTrigger>
          <TabsTrigger value="optimal-bid">
            <Target className="mr-1.5 h-4 w-4" />
            Optimal narx
          </TabsTrigger>
          <TabsTrigger value="similarity">
            <GitCompareArrows className="mr-1.5 h-4 w-4" />
            O&apos;xshashlik
          </TabsTrigger>
          <TabsTrigger value="trend-forecast">
            <TrendingUp className="mr-1.5 h-4 w-4" />
            Bozor prognozi
          </TabsTrigger>
        </TabsList>

        {/* ===== WIN PROBABILITY TAB ===== */}
        <TabsContent value="win-probability" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
              <div className="mb-4">
                <h3 className="text-[17px] font-semibold tracking-[-0.02em] flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  G&apos;alaba ehtimolini hisoblash
                </h3>
                <p className="text-[14px] text-muted-foreground mt-1">
                  Tender va kompaniya ma&apos;lumotlarini kiriting — AI g&apos;alaba ehtimolini bashorat qiladi
                </p>
              </div>
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Kategoriya <span className="text-red-500">*</span>
                    </Label>
                    <Select value={wpCategory} onValueChange={(v) => setWpCategory(v ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategoriya tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Viloyat <span className="text-red-500">*</span>
                    </Label>
                    <Select value={wpRegion} onValueChange={(v) => setWpRegion(v ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Viloyat tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tender summasi (UZS)</Label>
                    <input
                      type="number"
                      placeholder="100 000 000"
                      value={wpTenderAmount}
                      onChange={(e) => setWpTenderAmount(e.target.value)}
                      className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sizning taklif narxingiz (UZS)</Label>
                    <input
                      type="number"
                      placeholder="90 000 000"
                      value={wpBidAmount}
                      onChange={(e) => setWpBidAmount(e.target.value)}
                      className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Kompaniya tajribasi (yil)</Label>
                    <input
                      type="number"
                      placeholder="3"
                      value={wpExperience}
                      onChange={(e) => setWpExperience(e.target.value)}
                      className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Raqobatchilar soni</Label>
                    <input
                      type="number"
                      placeholder="5"
                      value={wpCompetitors}
                      onChange={(e) => setWpCompetitors(e.target.value)}
                      className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Muddatgacha (kun)</Label>
                    <input
                      type="number"
                      placeholder="14"
                      value={wpDaysLeft}
                      onChange={(e) => setWpDaysLeft(e.target.value)}
                      className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Sohada oldingi g&apos;alabalar</Label>
                    <input
                      type="number"
                      placeholder="0"
                      value={wpPastWins}
                      onChange={(e) => setWpPastWins(e.target.value)}
                      className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      checked={wpCategoryMatch}
                      onCheckedChange={setWpCategoryMatch}
                    />
                    <Label>Soha mos keladi</Label>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      checked={wpRegionMatch}
                      onCheckedChange={setWpRegionMatch}
                    />
                    <Label>Hudud mos keladi</Label>
                  </div>
                </div>

                <button
                  onClick={handleWinPredict}
                  disabled={wpPredicting || !wpCategory || !wpRegion}
                  className={`w-full rounded-full bg-[#1d1d1f] text-white px-6 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f] flex items-center justify-center gap-2 ${
                    wpPredicting || !wpCategory || !wpRegion ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {wpPredicting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Hisoblanmoqda...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-4 w-4" />
                      G&apos;alaba ehtimolini hisoblash
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Side info card */}
            <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
              <div className="mb-4">
                <h3 className="text-base font-semibold tracking-[-0.02em] flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Qanday ishlaydi?
                </h3>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  AI model quyidagi omillarni tahlil qiladi:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span><strong className="text-foreground">Narx ustunligi</strong> — taklif narxi va tender summasi nisbati</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span><strong className="text-foreground">Tajriba</strong> — kompaniyaning sohadagi ish tajribasi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span><strong className="text-foreground">Soha mosligi</strong> — kompaniya profili va tender kategoriyasi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span><strong className="text-foreground">Raqobat</strong> — ishtirokchilar soni va bozor holati</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span><strong className="text-foreground">Muddat</strong> — ariza topshirish uchun qolgan vaqt</span>
                  </li>
                </ul>
                <Separator />
                <p className="text-xs">
                  Ko&apos;proq ma&apos;lumot kiritilsa, bashorat aniqligi oshadi.
                </p>
              </div>
            </div>
          </div>

          {/* Win Probability Result */}
          {wpResult && (
            <div className={`rounded-2xl border backdrop-blur-xl p-6 transition-all hover:shadow-lg ${riskBgColors[wpResult.risk_level] ?? "border-white/50 bg-white/60 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]"}`}>
              <div className="mb-4">
                <h3 className="text-[17px] font-semibold tracking-[-0.02em] flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  G&apos;alaba ehtimoli natijasi
                </h3>
              </div>
              <div className="space-y-6">
                {/* Main probability display */}
                <div className="flex flex-col items-center py-4">
                  <div className="relative">
                    <div className={`text-6xl font-bold ${
                      wpResult.win_probability >= 70
                        ? "text-green-600 dark:text-green-400"
                        : wpResult.win_probability >= 45
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                    }`}>
                      {wpResult.win_probability}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {riskIcons[wpResult.risk_level]}
                    <span className={`font-semibold ${riskColors[wpResult.risk_level] ?? ""}`}>
                      {riskLabels[wpResult.risk_level] ?? wpResult.risk_level}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
                    {wpResult.recommendation}
                  </p>
                </div>

                <Separator />

                {/* Probability bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">G&apos;alaba ehtimoli</span>
                    <span className="font-medium">{wpResult.win_probability}%</span>
                  </div>
                  <Progress
                    value={wpResult.win_probability}
                    className="h-3"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                <Separator />

                {/* Factors breakdown */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Omillar tahlili</h4>
                  <div className="space-y-3">
                    {wpResult.factors.map((factor, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="shrink-0">
                          {factor.impact > 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : factor.impact < 0 ? (
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-muted" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{factor.name}</span>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                                factor.impact > 0
                                  ? "bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f]"
                                  : factor.impact < 0
                                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                    : "bg-black/5 text-[#1d1d1f] dark:bg-white/10 dark:text-white"
                              }`}
                            >
                              {factor.impact > 0 ? "+" : ""}{factor.impact}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {factor.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Meta info */}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span>Model:</span>
                    <span className="inline-flex items-center rounded-full border border-black/10 px-2.5 py-0.5 text-[12px] font-semibold dark:border-white/10">{wpResult.model_version}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Ishonchlilik:</span>
                    <span className="font-medium text-foreground">{wpResult.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ===== RISK ASSESSMENT TAB ===== */}
        <TabsContent value="risk-assessment" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
              <div className="mb-4">
                <h3 className="text-[17px] font-semibold tracking-[-0.02em] flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Risk tahlili
                </h3>
                <p className="text-[14px] text-muted-foreground mt-1">
                  Tender bilan bog&apos;liq barcha xavflarni baholang
                </p>
              </div>
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Kategoriya <span className="text-red-500">*</span></Label>
                    <Select value={raCategory} onValueChange={(v) => setRaCategory(v ?? "")}>
                      <SelectTrigger><SelectValue placeholder="Kategoriya tanlang" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Viloyat <span className="text-red-500">*</span></Label>
                    <Select value={raRegion} onValueChange={(v) => setRaRegion(v ?? "")}>
                      <SelectTrigger><SelectValue placeholder="Viloyat tanlang" /></SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Tender summasi (UZS)</Label>
                    <input type="number" placeholder="100 000 000" value={raTenderAmount} onChange={(e) => setRaTenderAmount(e.target.value)} className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bozor o&apos;rtachasi (UZS)</Label>
                    <input type="number" placeholder="90 000 000" value={raAvgMarket} onChange={(e) => setRaAvgMarket(e.target.value)} className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Kompaniya byudjeti (UZS)</Label>
                    <input type="number" placeholder="150 000 000" value={raCompanyBudget} onChange={(e) => setRaCompanyBudget(e.target.value)} className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Tajriba (yil)</Label>
                    <input type="number" placeholder="3" value={raExperience} onChange={(e) => setRaExperience(e.target.value)} className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Raqobatchilar soni</Label>
                    <input type="number" placeholder="5" value={raCompetitors} onChange={(e) => setRaCompetitors(e.target.value)} className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Muddatgacha (kun)</Label>
                    <input type="number" placeholder="14" value={raDaysLeft} onChange={(e) => setRaDaysLeft(e.target.value)} className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Faol loyihalar soni</Label>
                    <input type="number" placeholder="0" value={raActiveProjects} onChange={(e) => setRaActiveProjects(e.target.value)} className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Talab qilingan hujjatlar</Label>
                    <input type="number" placeholder="5" value={raDocCount} onChange={(e) => setRaDocCount(e.target.value)} className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10" />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch checked={raCategoryMatch} onCheckedChange={setRaCategoryMatch} />
                    <Label>Soha mos</Label>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <Switch checked={raRequiresLicense} onCheckedChange={setRaRequiresLicense} />
                    <Label>Litsenziya talab qilinadi</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={raRequiresGuarantee} onCheckedChange={setRaRequiresGuarantee} />
                    <Label>Bank kafolati kerak</Label>
                  </div>
                </div>

                <button
                  onClick={handleRiskAssess}
                  disabled={raPredicting || !raCategory || !raRegion}
                  className={`w-full rounded-full bg-[#1d1d1f] text-white px-6 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f] flex items-center justify-center gap-2 ${
                    raPredicting || !raCategory || !raRegion ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {raPredicting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Tahlil qilinmoqda...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Xavflarni baholash
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
              <div className="mb-4">
                <h3 className="text-base font-semibold tracking-[-0.02em] flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Baholash mezonlari
                </h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500 mt-1 shrink-0" />
                  <span><strong className="text-foreground">Past xavf</strong> — xavfsiz, davom etish mumkin</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <span><strong className="text-foreground">O&apos;rtacha xavf</strong> — ehtiyotkorlik kerak</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500 mt-1 shrink-0" />
                  <span><strong className="text-foreground">Yuqori xavf</strong> — jiddiy tahlil zarur</span>
                </div>
                <Separator />
                <p className="text-xs">6 ta xavf kategoriyasi tahlil qilinadi: byudjet, muddat, raqobat, imkoniyat, hujjatlar va bozor.</p>
              </div>
            </div>
          </div>

          {/* Risk Assessment Result */}
          {raResult && (
            <div className="space-y-6">
              {/* Overall score */}
              <div className={`rounded-2xl border backdrop-blur-xl p-6 transition-all hover:shadow-lg ${
                raResult.overall_level === "past"
                  ? "bg-green-500/5 border-green-500/20"
                  : raResult.overall_level === "o'rta"
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-red-500/5 border-red-500/20"
              }`}>
                <div className="pt-0">
                  <div className="flex flex-col items-center py-4">
                    <div className={`text-5xl font-bold ${
                      raResult.overall_level === "past"
                        ? "text-green-600 dark:text-green-400"
                        : raResult.overall_level === "o'rta"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400"
                    }`}>
                      {raResult.overall_score}%
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {raResult.overall_level === "past" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {raResult.overall_level === "o'rta" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                      {raResult.overall_level === "yuqori" && <Shield className="h-5 w-5 text-red-500" />}
                      <span className="font-semibold">{raResult.overall_label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-center max-w-lg">{raResult.verdict}</p>

                    <div className="flex gap-6 mt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{raResult.high_risk_count}</div>
                        <div className="text-xs text-muted-foreground">Yuqori</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{raResult.medium_risk_count}</div>
                        <div className="text-xs text-muted-foreground">O&apos;rtacha</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{raResult.low_risk_count}</div>
                        <div className="text-xs text-muted-foreground">Past</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual risks */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {raResult.risks.map((risk, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
                    <div className="mb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">{risk.name}</h3>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                          risk.level === "past"
                            ? "bg-black/5 text-[#1d1d1f] dark:bg-white/10 dark:text-white"
                            : risk.level === "o'rta"
                              ? "border border-black/10 dark:border-white/10"
                              : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}>
                          {risk.label}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Xavf darajasi</span>
                          <span>{risk.score}%</span>
                        </div>
                        <Progress value={risk.score} className="h-2" />
                      </div>
                      <ul className="space-y-1">
                        {risk.details.map((detail, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="mt-1.5 shrink-0">
                              {risk.level === "yuqori" ? (
                                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              ) : risk.level === "o'rta" ? (
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              ) : (
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              )}
                            </span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {raResult.recommendations.length > 0 && (
                <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold tracking-[-0.02em] flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Tavsiyalar
                    </h3>
                  </div>
                  <div>
                    <ul className="space-y-2">
                      {raResult.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <ArrowUpRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ===== OPTIMAL BID TAB ===== */}
        <TabsContent value="optimal-bid" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
              <div className="mb-4">
                <h3 className="text-[17px] font-semibold tracking-[-0.02em] flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Optimal narx tavsiyasi
                </h3>
                <p className="text-[14px] text-muted-foreground mt-1">
                  AI turli narx darajalarini simulyatsiya qilib, eng yaxshi taklifni topadi
                </p>
              </div>
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Kategoriya <span className="text-red-500">*</span>
                    </Label>
                    <Select value={obCategory} onValueChange={(v) => setObCategory(v ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategoriya tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Viloyat <span className="text-red-500">*</span>
                    </Label>
                    <Select value={obRegion} onValueChange={(v) => setObRegion(v ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Viloyat tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Tender summasi (UZS) <span className="text-red-500">*</span>
                  </Label>
                  <input
                    type="number"
                    placeholder="100 000 000"
                    value={obTenderAmount}
                    onChange={(e) => setObTenderAmount(e.target.value)}
                    className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Kompaniya tajribasi (yil)</Label>
                    <input
                      type="number"
                      placeholder="3"
                      value={obExperience}
                      onChange={(e) => setObExperience(e.target.value)}
                      className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Raqobatchilar soni</Label>
                    <input
                      type="number"
                      placeholder="5"
                      value={obCompetitors}
                      onChange={(e) => setObCompetitors(e.target.value)}
                      className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Muddatgacha (kun)</Label>
                    <input
                      type="number"
                      placeholder="14"
                      value={obDaysLeft}
                      onChange={(e) => setObDaysLeft(e.target.value)}
                      className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Oldingi g&apos;alabalar</Label>
                    <input
                      type="number"
                      placeholder="0"
                      value={obPastWins}
                      onChange={(e) => setObPastWins(e.target.value)}
                      className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch checked={obCategoryMatch} onCheckedChange={setObCategoryMatch} />
                    <Label>Soha mos keladi</Label>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch checked={obRegionMatch} onCheckedChange={setObRegionMatch} />
                    <Label>Hudud mos keladi</Label>
                  </div>
                </div>

                <button
                  onClick={handleOptimalBid}
                  disabled={obPredicting || !obCategory || !obRegion || !obTenderAmount}
                  className={`w-full rounded-full bg-[#1d1d1f] text-white px-6 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f] flex items-center justify-center gap-2 ${
                    obPredicting || !obCategory || !obRegion || !obTenderAmount ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {obPredicting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Hisoblanmoqda...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4" />
                      Optimal narxni hisoblash
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
              <div className="mb-4">
                <h3 className="text-base font-semibold tracking-[-0.02em] flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Strategiyalar haqida
                </h3>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-foreground">Muvozanatli</strong>
                      <p>Foyda va g&apos;alaba ehtimoli o&apos;rtasidagi eng yaxshi balans (tavsiya etiladi)</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-foreground">Agressiv</strong>
                      <p>Eng past narx bilan eng yuqori g&apos;alaba ehtimoli</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-foreground">Konservativ</strong>
                      <p>Yuqori foyda darajasi bilan maqbul g&apos;alaba ehtimoli</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <p className="text-xs">
                  AI {18} ta narx nuqtasini simulyatsiya qiladi va kutilayotgan qiymat (EV) asosida eng yaxshisini tanlaydi.
                </p>
              </div>
            </div>
          </div>

          {/* Optimal Bid Result */}
          {obResult && (
            <div className="space-y-6">
              {/* Main result */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-xl p-6 transition-all hover:shadow-lg">
                <div className="mb-4">
                  <h3 className="text-[17px] font-semibold tracking-[-0.02em] flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Optimal narx natijasi
                  </h3>
                </div>
                <div>
                  <div className="grid gap-6 md:grid-cols-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Optimal taklif narxi</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatAmount(obResult.optimal_bid)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">G&apos;alaba ehtimoli</p>
                      <p className={`text-3xl font-bold ${
                        obResult.win_probability >= 70
                          ? "text-green-600 dark:text-green-400"
                          : obResult.win_probability >= 45
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                      }`}>
                        {obResult.win_probability}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Foyda darajasi</p>
                      <p className="text-3xl font-bold">{obResult.profit_margin}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Kutilayotgan qiymat</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatAmount(obResult.expected_value)}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <p className="text-sm text-muted-foreground">{obResult.recommendation}</p>
                </div>
              </div>

              {/* Strategies comparison */}
              <div className="grid gap-4 md:grid-cols-3">
                {obResult.strategies.map((strategy, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg ${strategy.recommended ? "!border-primary ring-2 ring-primary/20" : ""}`}
                  >
                    <div className="mb-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                          {idx === 0 && <Star className="h-4 w-4 text-primary" />}
                          {idx === 1 && <Zap className="h-4 w-4 text-amber-500" />}
                          {idx === 2 && <ShieldCheck className="h-4 w-4 text-green-500" />}
                          {strategy.name}
                        </h3>
                        {strategy.recommended && (
                          <span className="inline-flex items-center rounded-full bg-[#1d1d1f] text-white px-2.5 py-0.5 text-[12px] font-semibold dark:bg-white dark:text-[#1d1d1f]">Tavsiya</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{strategy.description}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taklif narxi</span>
                        <span className="font-semibold">{formatAmount(strategy.bid_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">G&apos;alaba ehtimoli</span>
                        <span className={`font-semibold ${
                          strategy.win_probability >= 70
                            ? "text-green-600 dark:text-green-400"
                            : strategy.win_probability >= 45
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400"
                        }`}>
                          {strategy.win_probability}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Foyda darajasi</span>
                        <span className="font-semibold">{strategy.profit_margin}%</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Kutilayotgan qiymat</span>
                        <span className="font-bold text-primary">{formatAmount(strategy.expected_value)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Simulation chart data as table */}
              <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
                <div className="mb-4">
                  <h3 className="text-base font-semibold tracking-[-0.02em]">Narx simulyatsiyasi</h3>
                  <p className="text-[14px] text-muted-foreground mt-1">
                    Turli narx darajalarida g&apos;alaba ehtimoli va kutilayotgan qiymat
                  </p>
                </div>
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Nisbat</th>
                          <th className="text-right py-2 px-4 text-muted-foreground font-medium">Taklif narxi</th>
                          <th className="text-right py-2 px-4 text-muted-foreground font-medium">G&apos;alaba %</th>
                          <th className="text-right py-2 px-4 text-muted-foreground font-medium">Foyda %</th>
                          <th className="text-right py-2 pl-4 text-muted-foreground font-medium">Kutilayotgan qiymat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {obResult.chart_data.map((point, idx) => {
                          const isOptimal = point.bid_ratio === obResult.optimal_ratio;
                          return (
                            <tr
                              key={idx}
                              className={`border-b last:border-0 ${isOptimal ? "bg-primary/5 font-semibold" : ""}`}
                            >
                              <td className="py-2 pr-4">
                                {(point.bid_ratio * 100).toFixed(0)}%
                                {isOptimal && <span className="inline-flex items-center rounded-full border border-black/10 px-2.5 py-0.5 text-[12px] font-semibold dark:border-white/10 ml-2">Optimal</span>}
                              </td>
                              <td className="text-right py-2 px-4">{formatAmount(point.bid_amount)}</td>
                              <td className={`text-right py-2 px-4 ${
                                point.win_probability >= 70
                                  ? "text-green-600 dark:text-green-400"
                                  : point.win_probability >= 45
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-red-600 dark:text-red-400"
                              }`}>
                                {point.win_probability}%
                              </td>
                              <td className="text-right py-2 px-4">{point.profit_margin}%</td>
                              <td className="text-right py-2 pl-4">{formatAmount(point.expected_value)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ===== SIMILARITY TAB ===== */}
        <TabsContent value="similarity" className="space-y-6">
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <div className="mb-4">
              <h3 className="text-[17px] font-semibold tracking-[-0.02em] flex items-center gap-2">
                <GitCompareArrows className="h-5 w-5 text-primary" />
                Tender o&apos;xshashligini taqqoslash
              </h3>
              <p className="text-[14px] text-muted-foreground mt-1">
                Ikki tenderni kiritib, ular qanchalik o&apos;xshash ekanini aniqlang
              </p>
            </div>
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Tender A */}
                <div className="space-y-4 p-4 border rounded-xl border-black/10 dark:border-white/10">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-[#1d1d1f] text-white px-2.5 py-0.5 text-[12px] font-semibold dark:bg-white dark:text-[#1d1d1f]">A</span> Birinchi tender
                  </h4>
                  <div className="space-y-2">
                    <Label>Sarlavha</Label>
                    <input placeholder="Tender sarlavhasi" value={tsaTitleA} onChange={(e) => setTsaTitleA(e.target.value)} className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tavsif</Label>
                    <Textarea placeholder="Tender tavsifi..." rows={2} value={tsaDescA} onChange={(e) => setTsaDescA(e.target.value)} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Kategoriya</Label>
                      <Select value={tsaCatA} onValueChange={(v) => setTsaCatA(v ?? "")}>
                        <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Viloyat</Label>
                      <Select value={tsaRegA} onValueChange={(v) => setTsaRegA(v ?? "")}>
                        <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                        <SelectContent>
                          {REGIONS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Summa (UZS)</Label>
                    <input type="number" placeholder="50 000 000" value={tsaAmountA} onChange={(e) => setTsaAmountA(e.target.value)} className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10" />
                  </div>
                </div>

                {/* Tender B */}
                <div className="space-y-4 p-4 border rounded-xl border-black/10 dark:border-white/10">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-black/5 text-[#1d1d1f] px-2.5 py-0.5 text-[12px] font-semibold dark:bg-white/10 dark:text-white">B</span> Ikkinchi tender
                  </h4>
                  <div className="space-y-2">
                    <Label>Sarlavha</Label>
                    <input placeholder="Tender sarlavhasi" value={tsaTitleB} onChange={(e) => setTsaTitleB(e.target.value)} className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tavsif</Label>
                    <Textarea placeholder="Tender tavsifi..." rows={2} value={tsaDescB} onChange={(e) => setTsaDescB(e.target.value)} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Kategoriya</Label>
                      <Select value={tsaCatB} onValueChange={(v) => setTsaCatB(v ?? "")}>
                        <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Viloyat</Label>
                      <Select value={tsaRegB} onValueChange={(v) => setTsaRegB(v ?? "")}>
                        <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                        <SelectContent>
                          {REGIONS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Summa (UZS)</Label>
                    <input type="number" placeholder="55 000 000" value={tsaAmountB} onChange={(e) => setTsaAmountB(e.target.value)} className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSimilarity}
                disabled={tsaPredicting || (!tsaTitleA && !tsaDescA) || (!tsaTitleB && !tsaDescB)}
                className={`w-full rounded-full bg-[#1d1d1f] text-white px-6 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f] flex items-center justify-center gap-2 ${
                  tsaPredicting || (!tsaTitleA && !tsaDescA) || (!tsaTitleB && !tsaDescB) ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {tsaPredicting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Taqqoslanmoqda...
                  </>
                ) : (
                  <>
                    <GitCompareArrows className="h-4 w-4" />
                    Taqqoslash
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Similarity Result */}
          {tsaResult && (
            <div className={`rounded-2xl border backdrop-blur-xl p-6 transition-all hover:shadow-lg ${
              tsaResult.level === "yuqori"
                ? "bg-green-500/5 border-green-500/20"
                : tsaResult.level === "o'rta"
                  ? "bg-amber-500/5 border-amber-500/20"
                  : "bg-muted/50 border-white/50 dark:border-white/[0.08]"
            }`}>
              <div>
                <div className="flex flex-col items-center py-4">
                  <div className={`text-6xl font-bold ${
                    tsaResult.overall_similarity >= 75
                      ? "text-green-600 dark:text-green-400"
                      : tsaResult.overall_similarity >= 45
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                  }`}>
                    {tsaResult.overall_similarity}%
                  </div>
                  <p className="text-sm font-medium mt-2">
                    {tsaResult.overall_similarity >= 75
                      ? "Juda o'xshash tenderlar"
                      : tsaResult.overall_similarity >= 45
                        ? "O'rtacha o'xshashlik"
                        : "Kam o'xshashlik"}
                  </p>
                </div>

                <Separator className="my-4" />

                <div className="grid gap-4 sm:grid-cols-4">
                  {tsaResult.factors.map((factor, idx) => (
                    <div key={idx} className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        {factor.name} ({factor.weight}%)
                      </p>
                      <div className="space-y-1">
                        <p className={`text-2xl font-bold ${
                          factor.score >= 75
                            ? "text-green-600 dark:text-green-400"
                            : factor.score >= 45
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                        }`}>
                          {factor.score}%
                        </p>
                        <Progress value={factor.score} className="h-1.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ===== TREND FORECAST TAB ===== */}
        <TabsContent value="trend-forecast" className="space-y-6">
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <div className="mb-4">
              <h3 className="text-[17px] font-semibold tracking-[-0.02em]">Bozor trend prognozi</h3>
              <p className="text-[14px] text-muted-foreground mt-1">
                Tarixiy ma&apos;lumotlar asosida kelgusi oylar uchun tender bozori prognozi
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Kategoriya (ixtiyoriy)</Label>
                  <Select value={tfCategory} onValueChange={(v) => setTfCategory(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Barchasi" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Viloyat (ixtiyoriy)</Label>
                  <Select value={tfRegion} onValueChange={(v) => setTfRegion(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Barchasi" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prognoz muddati (oy)</Label>
                  <Select value={tfMonths} onValueChange={(v) => setTfMonths(v ?? "6")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 oy</SelectItem>
                      <SelectItem value="6">6 oy</SelectItem>
                      <SelectItem value="9">9 oy</SelectItem>
                      <SelectItem value="12">12 oy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <button
                onClick={handleTrendForecast}
                disabled={tfLoading}
                className={`rounded-full bg-[#1d1d1f] text-white px-6 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f] flex items-center justify-center gap-2 sm:w-auto w-full ${
                  tfLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {tfLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Tahlil qilinmoqda...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    Prognoz qilish
                  </>
                )}
              </button>
            </div>
          </div>

          {tfResult && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
                  <p className="text-xs text-muted-foreground mb-1">Tender soni trendi</p>
                  <p className={`text-xl font-bold ${
                    tfResult.summary.count_trend === "o'sish"
                      ? "text-green-600"
                      : tfResult.summary.count_trend === "pasayish"
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }`}>
                    {tfResult.summary.count_trend === "o'sish" ? "O'sish" :
                     tfResult.summary.count_trend === "pasayish" ? "Pasayish" : "Barqaror"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tfResult.summary.growth_rate > 0 ? "+" : ""}{tfResult.summary.growth_rate}%
                  </p>
                </div>
                <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
                  <p className="text-xs text-muted-foreground mb-1">Summa trendi</p>
                  <p className={`text-xl font-bold ${
                    tfResult.summary.amount_trend === "o'sish"
                      ? "text-green-600"
                      : tfResult.summary.amount_trend === "pasayish"
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }`}>
                    {tfResult.summary.amount_trend === "o'sish" ? "O'sish" :
                     tfResult.summary.amount_trend === "pasayish" ? "Pasayish" : "Barqaror"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O&apos;rtacha: {formatAmount(tfResult.summary.avg_monthly_amount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
                  <p className="text-xs text-muted-foreground mb-1">Tahlil qilingan</p>
                  <p className="text-xl font-bold">{tfResult.summary.total_months_analyzed} oy</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O&apos;rtacha {tfResult.summary.avg_monthly_count} ta/oy
                  </p>
                </div>
                <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
                  <p className="text-xs text-muted-foreground mb-1">Ishonchlilik</p>
                  <p className={`text-xl font-bold ${
                    tfResult.summary.confidence >= 60
                      ? "text-green-600"
                      : tfResult.summary.confidence >= 40
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}>
                    {tfResult.summary.confidence}%
                  </p>
                  <Progress value={tfResult.summary.confidence} className="h-1.5 mt-2" />
                </div>
              </div>

              {/* Tender Count Chart */}
              <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
                <div className="mb-4">
                  <h3 className="text-base font-semibold tracking-[-0.02em]">Tender soni — tarix va prognoz</h3>
                </div>
                <div>
                  <ChartContainer
                    config={{
                      count: { label: "Haqiqiy soni", color: "var(--chart-1)" },
                      trend_count: { label: "Trend chizig'i", color: "var(--chart-3)" },
                      predicted_count: { label: "Prognoz", color: "var(--chart-2)" },
                    }}
                    className="h-[300px]"
                  >
                    <ComposedChart
                      data={[
                        ...tfResult.history.map((h) => ({
                          month: h.month,
                          count: h.count,
                          trend_count: h.trend_count,
                        })),
                        ...tfResult.forecast.map((f) => ({
                          month: f.month,
                          predicted_count: f.predicted_count,
                        })),
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="Haqiqiy" />
                      <Line dataKey="trend_count" stroke="var(--chart-3)" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Trend" />
                      <Bar dataKey="predicted_count" fill="var(--chart-2)" radius={[4, 4, 0, 0]} opacity={0.6} name="Prognoz" />
                    </ComposedChart>
                  </ChartContainer>
                </div>
              </div>

              {/* Amount Chart */}
              <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
                <div className="mb-4">
                  <h3 className="text-base font-semibold tracking-[-0.02em]">O&apos;rtacha summa — tarix va prognoz</h3>
                </div>
                <div>
                  <ChartContainer
                    config={{
                      avg_amount: { label: "Haqiqiy summa", color: "var(--chart-1)" },
                      trend_amount: { label: "Trend chizig'i", color: "var(--chart-3)" },
                      predicted_avg_amount: { label: "Prognoz summa", color: "var(--chart-4)" },
                    }}
                    className="h-[300px]"
                  >
                    <AreaChart
                      data={[
                        ...tfResult.history.map((h) => ({
                          month: h.month,
                          avg_amount: h.avg_amount,
                          trend_amount: h.trend_amount,
                        })),
                        ...tfResult.forecast.map((f) => ({
                          month: f.month,
                          predicted_avg_amount: f.predicted_avg_amount,
                        })),
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area dataKey="avg_amount" fill="var(--chart-1)" fillOpacity={0.2} stroke="var(--chart-1)" strokeWidth={2} name="Haqiqiy" />
                      <Line dataKey="trend_amount" stroke="var(--chart-3)" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Trend" />
                      <Area dataKey="predicted_avg_amount" fill="var(--chart-4)" fillOpacity={0.15} stroke="var(--chart-4)" strokeWidth={2} strokeDasharray="8 4" name="Prognoz" />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </div>

              {/* Insights */}
              {tfResult.insights.length > 0 && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-xl p-6 transition-all hover:shadow-lg">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold tracking-[-0.02em] flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      AI xulosalari
                    </h3>
                  </div>
                  <div>
                    <ul className="space-y-2">
                      {tfResult.insights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <ArrowUpRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Forecast Table */}
              <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
                <div className="mb-4">
                  <h3 className="text-base font-semibold tracking-[-0.02em]">Prognoz jadvali</h3>
                </div>
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Oy</th>
                          <th className="text-right py-2 font-medium">Tender soni</th>
                          <th className="text-right py-2 font-medium">O&apos;rtacha summa</th>
                          <th className="text-right py-2 font-medium">Jami summa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tfResult.forecast.map((f) => (
                          <tr key={f.month} className="border-b last:border-0">
                            <td className="py-2 font-medium">{f.month}</td>
                            <td className="py-2 text-right">{f.predicted_count}</td>
                            <td className="py-2 text-right">{formatAmount(f.predicted_avg_amount)}</td>
                            <td className="py-2 text-right font-medium">{formatAmount(f.predicted_total_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
