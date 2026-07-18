"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileSignature,
  Building2,

  Calendar,
  MapPin,
  Tag,
  FileText,
  Download,
  ExternalLink,
  Hash,
  User,
  Loader2,
  Clock,
} from "lucide-react";
import { formatAmount } from "@/lib/format";
import api from "@/lib/api";

interface ContractDetail {
  id: number;
  contract_number: string | null;
  tender_id: number | null;
  title: string;
  buyer_name: string;
  buyer_stir: string | null;
  supplier_name: string;
  supplier_stir: string | null;
  category: string | null;
  region: string | null;
  amount: number | null;
  currency: string;
  signed_date: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  contract_type: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Faol", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  completed: { label: "Bajarilgan", color: "bg-sky-400/10 text-sky-500 border-sky-400/20" },
  terminated: { label: "Bekor qilingan", color: "bg-red-500/10 text-red-600 border-red-500/20" },
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" });
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get(`/v1/contracts/${id}`)
      .then((r) => setContract(r.data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Orqaga
        </button>
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl py-16 text-center dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
          <FileSignature className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 font-semibold">Shartnoma topilmadi</p>
          <Link href="/contracts" className="text-[13px] text-sky-500 hover:underline mt-2 inline-block">
            Shartnomalar ro&apos;yxatiga qaytish
          </Link>
        </div>
      </div>
    );
  }

  const st = statusConfig[contract.status] ?? { label: contract.status, color: "bg-gray-100 text-gray-600" };

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          Orqaga
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-[-0.03em] leading-tight">{contract.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              {contract.contract_number && (
                <span className="text-[13px] text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5" />
                  {contract.contract_number}
                </span>
              )}
              {contract.contract_type && (
                <span className="text-[12px] text-muted-foreground bg-black/[0.04] dark:bg-white/[0.06] rounded-full px-2.5 py-0.5">
                  {contract.contract_type}
                </span>
              )}
            </div>
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1 text-[12px] font-semibold ${st.color}`}>
            {st.label}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tomonlar */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
            <h2 className="text-[15px] font-bold mb-4">Shartnoma tomonlari</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-black/[0.06] bg-white/80 p-4 dark:bg-white/[0.03] dark:border-white/[0.06]">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Buyurtmachi</p>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-sky-400/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold">{contract.buyer_name}</p>
                    {contract.buyer_stir && (
                      <p className="text-[12px] text-muted-foreground mt-0.5">STIR: {contract.buyer_stir}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-black/[0.06] bg-white/80 p-4 dark:bg-white/[0.03] dark:border-white/[0.06]">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ta&apos;minotchi</p>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold">{contract.supplier_name}</p>
                    {contract.supplier_stir && (
                      <p className="text-[12px] text-muted-foreground mt-0.5">STIR: {contract.supplier_stir}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tafsilotlar */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
            <h2 className="text-[15px] font-bold mb-4">Tafsilotlar</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {contract.category && (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Tag className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Kategoriya</p>
                    <p className="text-[13px] font-semibold">{contract.category}</p>
                  </div>
                </div>
              )}
              {contract.region && (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Viloyat</p>
                    <p className="text-[13px] font-semibold">{contract.region}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-sky-400/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-sky-500" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Imzolangan sana</p>
                  <p className="text-[13px] font-semibold">{formatDate(contract.signed_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Muddat</p>
                  <p className="text-[13px] font-semibold">
                    {formatDate(contract.start_date)} — {formatDate(contract.end_date)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Hujjat */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
            <h2 className="text-[15px] font-bold mb-4">Hujjat</h2>
            <div className="rounded-xl border border-dashed border-black/10 dark:border-white/10 bg-muted/30 p-6 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-[13px] font-semibold text-muted-foreground">Shartnoma hujjati</p>
              <p className="text-[12px] text-muted-foreground/70 mt-1 max-w-sm mx-auto">
                Shartnomaning asl PDF nusxasi manba tizimda saqlanadi. Hujjatni ko&apos;rish uchun manba tizimga o&apos;ting.
              </p>
              <button
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1d1d1f] text-white px-5 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-md active:scale-[0.98] dark:bg-white dark:text-[#1d1d1f]"
                onClick={() => alert("Shartnoma hujjati hozircha mavjud emas. Tashqi tizim bilan integratsiya ulangandan so'ng hujjatlarni yuklab olish imkoniyati paydo bo'ladi.")}
              >
                <Download className="h-4 w-4" />
                Hujjatni yuklab olish
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Summa */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Shartnoma summasi</p>
            <p className="text-[28px] font-extrabold mt-1">
              {contract.amount ? formatAmount(contract.amount) : "—"}
            </p>
            <p className="text-[13px] text-muted-foreground">{contract.currency}</p>
          </div>

          {/* Bog'langan tender */}
          {contract.tender_id && (
            <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Bog&apos;langan tender</p>
              <Link
                href={`/tenders/${contract.tender_id}`}
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-sky-500 dark:text-sky-400 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Tender #{contract.tender_id} ni ko&apos;rish
              </Link>
            </div>
          )}

          {/* Tizimga qo'shilgan */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Tizimga qo&apos;shilgan</p>
            <p className="text-[13px] font-semibold">{formatDate(contract.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
