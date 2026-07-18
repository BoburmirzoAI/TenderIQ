"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Building,
  MapPin,
  Tag,
  ExternalLink,
  FileText,
  Kanban,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { TenderNotes } from "@/components/tender-notes";
import {
  formatAmount,
  formatDate,
  formatDateTime,
  getCategoryLabel,
  getRegionLabel,
  getStatusLabel,
} from "@/lib/format";
import type { TenderDetail } from "@/types";

const statusStyle: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 border-green-500/20",
  closed: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  draft: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
};

export default function TenderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tender, setTender] = useState<TenderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/v1/tenders/${params.id}`);
        setTender(data.data);
      } catch {
        toast.error("Tender topilmadi");
        router.push("/tenders");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!tender) return null;

  const infoItems = [
    { icon: Building, label: "Tashkilot", value: tender.organization ?? "—" },
    { icon: Tag, label: "Kategoriya", value: getCategoryLabel(tender.category) },
    { icon: MapPin, label: "Viloyat", value: getRegionLabel(tender.region) },
    { icon: Calendar, label: "Muddat", value: formatDate(tender.deadline) },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.back()}
          className="mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/70 backdrop-blur transition-all hover:bg-white hover:scale-105 dark:border-white/10 dark:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em] leading-[1.2] line-clamp-2">
            {tender.title}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[13px] text-muted-foreground">
              ID: {tender.external_id}
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-[13px] text-muted-foreground">
              Manba: {tender.source}
            </span>
          </div>
        </div>
        <span className={`mt-1 inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold ${statusStyle[tender.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
          {getStatusLabel(tender.status)}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-5">
          {/* Main info card */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
            <h2 className="text-[16px] font-bold mb-4">Asosiy ma&apos;lumotlar</h2>

            {tender.description && (
              <div className="mb-5">
                <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Tavsif</span>
                <p className="text-[14px] leading-relaxed mt-1.5 text-foreground/80 whitespace-pre-wrap">
                  {tender.description}
                </p>
              </div>
            )}

            <div className="grid gap-0 md:grid-cols-2 rounded-xl border border-black/[0.04] overflow-hidden dark:border-white/[0.04]">
              {infoItems.map(({ icon: Icon, label, value }, idx) => (
                <div key={label} className={`flex items-center gap-3 px-4 py-3.5 ${
                  idx < infoItems.length - (infoItems.length % 2 === 0 ? 2 : 1) ? "border-b" : ""
                } ${idx % 2 === 0 ? "md:border-r" : ""} border-black/[0.04] dark:border-white/[0.04]`}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.03] dark:bg-white/[0.05]">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[12px] text-muted-foreground">{label}</p>
                    <p className="text-[14px] font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {tender.requirements && (
              <div className="mt-5 pt-5 border-t border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Talablar</span>
                <p className="text-[14px] leading-relaxed mt-1.5 text-foreground/80 whitespace-pre-wrap">
                  {tender.requirements}
                </p>
              </div>
            )}

            {tender.contact_info && (
              <div className="mt-5 pt-5 border-t border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Aloqa ma&apos;lumotlari</span>
                <p className="text-[13px] mt-1.5">{tender.contact_info}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Financial card */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
            <h2 className="text-[16px] font-bold mb-4">Moliyaviy</h2>
            <div className="mb-4">
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Summa</span>
              <p className="text-[32px] font-extrabold tracking-[-0.03em] mt-1 leading-none">
                {formatAmount(tender.amount)}
              </p>
              <span className="text-[14px] text-muted-foreground mt-1 block">{tender.currency}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-black/[0.04] p-3.5 dark:border-white/[0.04]">
              <div>
                <p className="text-[12px] text-muted-foreground">E&apos;lon qilingan</p>
                <p className="text-[14px] font-medium mt-0.5">{formatDateTime(tender.published_at)}</p>
              </div>
              <div>
                <p className="text-[12px] text-muted-foreground">Tizimga qo&apos;shilgan</p>
                <p className="text-[14px] font-medium mt-0.5">{formatDateTime(tender.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Match score */}
          {tender.match_score != null && (
            <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
              <h2 className="text-[16px] font-bold mb-1">Moslik bali</h2>
              <p className="text-[13px] text-muted-foreground mb-4">Kompaniyangizga mosligi</p>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-[36px] font-extrabold tracking-[-0.04em] leading-none">
                  {Math.round(tender.match_score)}
                </span>
                <span className="text-[18px] font-bold text-muted-foreground mb-0.5">%</span>
              </div>
              <div className="h-2 rounded-full bg-black/[0.04] overflow-hidden dark:bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-400 transition-all duration-500"
                  style={{ width: `${tender.match_score}%` }}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <TenderNotes tenderId={tender.id} />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {tender.url && (
              <a href={tender.url} target="_blank" rel="noopener noreferrer">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Manbaga o&apos;tish
                </button>
              </a>
            )}
            {tender.document_urls && (
              <a href={tender.document_urls} target="_blank" rel="noopener noreferrer">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                  <FileText className="h-3.5 w-3.5" />
                  Hujjatlarni ko&apos;rish
                </button>
              </a>
            )}
            <button
              onClick={async () => {
                try {
                  await api.post("/v1/applications/", { tender_id: tender.id });
                  toast.success("Pipeline'ga qo'shildi!");
                } catch (err: unknown) {
                  const status = err && typeof err === "object" && "response" in err && (err as { response?: { status?: number } }).response?.status;
                  if (status === 409) { toast.info("Bu tender allaqachon pipeline'da"); }
                  else { toast.error("Xatolik yuz berdi"); }
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <Kanban className="h-3.5 w-3.5" />
              Pipeline&apos;ga qo&apos;shish
            </button>
            <button
              onClick={async () => {
                try {
                  const { data } = await api.post(`/v1/tenders/save/${tender.id}`);
                  setTender((prev) => prev ? { ...prev, is_saved: data.data.is_saved } : prev);
                  toast.success(data.data.is_saved ? "Saqlandi" : "Olib tashlandi");
                } catch { toast.error("Xatolik yuz berdi"); }
              }}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all ${
                tender.is_saved
                  ? "bg-[#1d1d1f] text-white hover:bg-[#333] dark:bg-white dark:text-[#1d1d1f] dark:hover:bg-white/90"
                  : "border border-black/10 bg-white/70 backdrop-blur hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              }`}
            >
              {tender.is_saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
              {tender.is_saved ? "Saqlangan" : "Saqlash"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
