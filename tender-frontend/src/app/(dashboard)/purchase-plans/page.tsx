"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Search, MapPin, Building2, Calendar, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  planned: "bg-blue-100 text-blue-700",
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
        <h1 className="text-2xl font-bold tracking-tight">Xarid-reja</h1>
        <p className="text-muted-foreground">Rejadagi tenderlar — rasmiy e'lon qilinishdan oldin</p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <ClipboardList className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Jami rejalar</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Banknote className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{formatAmount(stats.total_amount)}</p>
                <p className="text-xs text-muted-foreground">Umumiy summa</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.by_status?.planned || 0}</p>
                <p className="text-xs text-muted-foreground">Rejalashtirilgan</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Xarid-reja qidirish..." value={search} onChange={(e) => doSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : plans.length === 0 ? (
        <Card className="py-16 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Xarid-rejalar topilmadi</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <Card key={p.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {p.plan_number && <span className="text-xs font-mono text-muted-foreground">#{p.plan_number}</span>}
                      <Badge className={statusColors[p.status] || "bg-slate-100"}>{p.status}</Badge>
                      {p.category && <Badge variant="outline">{p.category}</Badge>}
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
