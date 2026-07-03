"use client";

import { useEffect, useState } from "react";
import { FileSignature, Search, Building2, Banknote, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  completed: "bg-blue-100 text-blue-700",
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
        <h1 className="text-2xl font-bold tracking-tight">Shartnomalar reestri</h1>
        <p className="text-muted-foreground">Tuzilgan shartnomalar bazasi</p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <FileSignature className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Jami shartnomalar</p>
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
                <p className="text-2xl font-bold">{stats.by_status?.active || 0}</p>
                <p className="text-xs text-muted-foreground">Faol shartnomalar</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Shartnoma qidirish..." value={search} onChange={(e) => doSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : contracts.length === 0 ? (
        <Card className="py-16 text-center">
          <FileSignature className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Shartnomalar topilmadi</p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Shartnoma</th>
                  <th className="px-4 py-3 text-left font-medium">Buyurtmachi</th>
                  <th className="px-4 py-3 text-left font-medium">Ta'minotchi</th>
                  <th className="px-4 py-3 text-right font-medium">Summa</th>
                  <th className="px-4 py-3 text-center font-medium">Holat</th>
                  <th className="px-4 py-3 text-center font-medium">Sana</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-1">{c.title}</p>
                      {c.contract_number && <p className="text-xs text-muted-foreground">#{c.contract_number}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.buyer_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.supplier_name}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {c.amount ? `${formatAmount(c.amount)} ${c.currency}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={statusColors[c.status] || "bg-slate-100"}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {c.signed_date ? new Date(c.signed_date).toLocaleDateString("uz") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
