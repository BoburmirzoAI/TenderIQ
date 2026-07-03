"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { formatAmount, formatDateTime } from "@/lib/format";
import type { PaymentRead, PlanInfo } from "@/types";

const statusMap: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Kutilmoqda", variant: "outline" },
  completed: { label: "To'langan", variant: "default" },
  failed: { label: "Xatolik", variant: "destructive" },
  refunded: { label: "Qaytarilgan", variant: "secondary" },
  cancelled: { label: "Bekor qilingan", variant: "destructive" },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRead[]>([]);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [paymentsRes, plansRes] = await Promise.allSettled([
          api.get("/v1/payments/history"),
          api.get("/v1/subscriptions/plans"),
        ]);
        if (paymentsRes.status === "fulfilled")
          setPayments(paymentsRes.value.data.data);
        if (plansRes.status === "fulfilled")
          setPlans(plansRes.value.data.data.filter((p: PlanInfo) => p.price_uzs > 0));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handlePayment = async () => {
    if (!selectedPlan || !selectedProvider) {
      toast.error("Reja va to'lov tizimini tanlang");
      return;
    }
    setPaying(true);
    try {
      const { data } = await api.post("/v1/payments/create", {
        plan: selectedPlan,
        provider: selectedProvider,
        return_url: window.location.href,
      });
      const result = data.data;
      if (result.payment_url) {
        const allowed = ["click.uz", "payme.uz", "uzum.uz", "localhost"];
        try {
          const host = new URL(result.payment_url).hostname;
          if (allowed.some((d) => host === d || host.endsWith(`.${d}`))) {
            window.location.href = result.payment_url;
          } else {
            toast.error("Noto'g'ri to'lov havolasi");
          }
        } catch {
          toast.error("Noto'g'ri to'lov havolasi");
        }
      } else {
        toast.info(
          "To'lov tizimi hali ulanmagan. Tez orada Click.uz va Payme orqali to'lash imkoniyati qo'shiladi."
        );
      }
    } catch {
      toast.error("To'lov yaratishda xatolik");
    } finally {
      setPaying(false);
    }
  };

  const totalPaid = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          To&apos;lovlar
        </h1>
        <p className="text-muted-foreground">
          To&apos;lov qilish va tarixni ko&apos;rish
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jami to&apos;langan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">To&apos;lovlar soni</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kutilmoqda</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.filter((p) => p.status === "pending").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Payment */}
      <Card>
        <CardHeader>
          <CardTitle>Yangi to&apos;lov</CardTitle>
          <CardDescription>
            Obuna rejangizni yangilash uchun to&apos;lov qiling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={selectedPlan}
              onValueChange={(v) => setSelectedPlan(v ?? "")}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Reja tanlang" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.name} value={plan.name}>
                    {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)} —{" "}
                    {formatAmount(plan.price_uzs)}/oy
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedProvider}
              onValueChange={(v) => setSelectedProvider(v ?? "")}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="To'lov tizimi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="click">Click.uz</SelectItem>
                <SelectItem value="payme">Payme</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handlePayment}
              disabled={paying || !selectedPlan || !selectedProvider}
            >
              {paying ? "Yaratilmoqda..." : "To'lov qilish"}
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>To&apos;lov tarixi</CardTitle>
          <CardDescription>Barcha o&apos;tgan to&apos;lovlar</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sana</TableHead>
                  <TableHead>Reja</TableHead>
                  <TableHead>Tizim</TableHead>
                  <TableHead>Tranzaksiya ID</TableHead>
                  <TableHead className="text-right">Summa</TableHead>
                  <TableHead>Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const s = statusMap[payment.status] ?? {
                    label: payment.status,
                    variant: "secondary" as const,
                  };
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="text-sm">
                        {formatDateTime(payment.created_at)}
                      </TableCell>
                      <TableCell className="capitalize font-medium">
                        {payment.plan}
                      </TableCell>
                      <TableCell className="capitalize">
                        {payment.provider}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {payment.transaction_id ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatAmount(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.variant}>{s.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">To&apos;lovlar mavjud emas</p>
              <p className="text-sm">Birinchi to&apos;lovingizni yuqorida amalga oshiring</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
