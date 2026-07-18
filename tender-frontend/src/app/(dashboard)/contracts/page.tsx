"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileSignature, Search, Banknote, Calendar, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAmount } from "@/lib/format";
import api from "@/lib/api";

interface Contract {
  id: number;
  contract_number: string | null;
  title: string;
  buyer_name: string;
  supplier_name: string;
  category: string | null;
  region: string | null;
  amount: number | null;
  currency: string;
  signed_date: string | null;
  status: string;
}

interface ContractStats { total: number; total_amount: number; by_status: Record<string, number>; }

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  completed: "bg-sky-100 text-sky-600",
  terminated: "bg-red-100 text-red-700",
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/v1/contracts"),
      api.get("/v1/contracts/stats"),
    ]).then(([c, s]) => {
      setContracts(c.data.data);
      setStats(s.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const doSearch = async (q: string) => {
    setSearch(q);
    const r = await api.get("/v1/contracts", { params: { q: q || undefined } });
    setContracts(r.data.data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Shartnomalar reestri</h1>
        <p className="text-sm text-muted-foreground mt-1">Tuzilgan shartnomalar bazasi</p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <div className="flex items-center gap-3 p-4">
              <FileSignature className="h-8 w-8 text-sky-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Jami shartnomalar</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <div className="flex items-center gap-3 p-4">
              <Banknote className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{formatAmount(stats.total_amount)}</p>
                <p className="text-xs text-muted-foreground">Umumiy summa</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <div className="flex items-center gap-3 p-4">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.by_status?.active || 0}</p>
                <p className="text-xs text-muted-foreground">Faol shartnomalar</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Shartnoma qidirish..."
          value={search}
          onChange={(e) => doSearch(e.target.value)}
          className="w-full h-11 rounded-xl border border-black/10 bg-white/80 pl-10 pr-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : contracts.length === 0 ? (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl py-16 text-center dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <FileSignature className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Shartnomalar topilmadi</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <div className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Shartnoma</th>
                  <th className="px-4 py-3 text-left font-medium">Buyurtmachi</th>
                  <th className="px-4 py-3 text-left font-medium">Ta&apos;minotchi</th>
                  <th className="px-4 py-3 text-right font-medium">Summa</th>
                  <th className="px-4 py-3 text-center font-medium">Holat</th>
                  <th className="px-4 py-3 text-center font-medium">Sana</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-sky-50/40 dark:hover:bg-sky-400/5 transition-colors cursor-pointer group">
                    <td className="px-4 py-3">
                      <Link href={`/contracts/${c.id}`} className="block">
                        <p className="font-medium line-clamp-1 group-hover:text-sky-500 dark:hover:text-sky-400 transition-colors">{c.title}</p>
                        {c.contract_number && <p className="text-xs text-muted-foreground">#{c.contract_number}</p>}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.buyer_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.supplier_name}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {c.amount ? `${formatAmount(c.amount)} ${c.currency}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${statusColors[c.status] || "bg-slate-100"}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      <Link href={`/contracts/${c.id}`} className="inline-flex items-center gap-1">
                        {c.signed_date ? new Date(c.signed_date).toLocaleDateString("uz") : "—"}
                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
