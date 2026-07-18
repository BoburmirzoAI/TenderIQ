"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Search, MapPin, Building2, Calendar, Banknote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAmount } from "@/lib/format";
import api from "@/lib/api";

interface Plan {
  id: number;
  plan_number: string | null;
  title: string;
  organization: string;
  category: string | null;
  region: string | null;
  budget_type: string | null;
  estimated_amount: number | null;
  currency: string;
  planned_date: string | null;
  status: string;
  lot_count: number | null;
}

interface PlanStats { total: number; by_status: Record<string, number>; total_amount: number; }

const statusColors: Record<string, string> = {
  planned: "bg-sky-100 text-sky-600",
  announced: "bg-green-100 text-green-700",
  completed: "bg-slate-100 text-slate-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function PurchasePlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/v1/purchase-plans"),
      api.get("/v1/purchase-plans/stats"),
    ]).then(([p, s]) => {
      setPlans(p.data.data);
      setStats(s.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const doSearch = async (q: string) => {
    setSearch(q);
    const r = await api.get("/v1/purchase-plans", { params: { q: q || undefined } });
    setPlans(r.data.data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Xarid-reja</h1>
        <p className="text-sm text-muted-foreground mt-1">Rejadagi tenderlar — rasmiy e&apos;lon qilinishdan oldin</p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-sky-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Jami rejalar</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <div className="flex items-center gap-3">
              <Banknote className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{formatAmount(stats.total_amount)}</p>
                <p className="text-xs text-muted-foreground">Umumiy summa</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.by_status?.planned || 0}</p>
                <p className="text-xs text-muted-foreground">Rejalashtirilgan</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input className="w-full h-11 rounded-xl border border-black/10 bg-white/80 pl-10 pr-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10" placeholder="Xarid-reja qidirish..." value={search} onChange={(e) => doSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl py-16 text-center dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Xarid-rejalar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <div key={p.id} className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {p.plan_number && <span className="text-xs font-mono text-muted-foreground">#{p.plan_number}</span>}
                      <span className={"rounded-full px-2.5 py-0.5 text-[12px] font-semibold " + (statusColors[p.status] || "bg-slate-100")}>{p.status}</span>
                      {p.category && <span className="rounded-full border border-black/10 dark:border-white/10 px-2.5 py-0.5 text-[12px] font-semibold">{p.category}</span>}
                    </div>
                    <h3 className="font-semibold leading-snug">{p.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {p.organization}</span>
                      {p.region && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.region}</span>}
                      {p.planned_date && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(p.planned_date).toLocaleDateString("uz")}</span>}
                    </div>
                  </div>
                  {p.estimated_amount && (
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatAmount(p.estimated_amount)}</p>
                      <p className="text-xs text-muted-foreground">{p.currency}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
