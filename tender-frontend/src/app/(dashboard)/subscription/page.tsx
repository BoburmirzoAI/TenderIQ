"use client";

import { useEffect, useState } from "react";
import { Check, Crown, Zap, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { formatAmount } from "@/lib/format";
import type { Subscription, PlanInfo, UsageStats } from "@/types";

const planIcons: Record<string, React.ReactNode> = {
  free: <Zap className="h-6 w-6" />,
  pro: <Crown className="h-6 w-6" />,
  business: <Building2 className="h-6 w-6" />,
};

const planColors: Record<string, string> = {
  free: "bg-muted",
  pro: "bg-primary text-primary-foreground",
  business: "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
};

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [subRes, plansRes, usageRes] = await Promise.allSettled([
          api.get("/v1/subscriptions/current"),
          api.get("/v1/subscriptions/plans"),
          api.get("/v1/subscriptions/usage"),
        ]);
        if (subRes.status === "fulfilled")
          setSubscription(subRes.value.data.data);
        if (plansRes.status === "fulfilled")
          setPlans(plansRes.value.data.data);
        if (usageRes.status === "fulfilled")
          setUsage(usageRes.value.data.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan ?? "free";
  const usagePercent = usage
    ? Math.round((usage.daily_requests_used / usage.daily_requests_limit) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Obuna boshqaruvi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Rejangizni tanlang va imkoniyatlaringizni kengaytiring
        </p>
      </div>

      {usage && (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <h3 className="text-[16px] font-bold mb-1">Joriy foydalanish</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Kunlik so&apos;rovlar
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {usage.daily_requests_used}
                </span>
                <span className="text-muted-foreground">
                  / {usage.daily_requests_limit}
                </span>
              </div>
              <Progress value={usagePercent} className="mt-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Saqlangan tenderlar
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {usage.saved_tenders}
                </span>
                <span className="text-muted-foreground">
                  /{" "}
                  {usage.max_saved_tenders === -1
                    ? "∞"
                    : usage.max_saved_tenders}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Qolgan kunlar
              </p>
              <span className="text-2xl font-bold">
                {usage.days_remaining ?? "∞"}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.name === currentPlan;
          return (
            <div key={plan.name} className="relative pt-4">
              {plan.name === "pro" && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 z-10 rounded-full bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] px-2.5 py-0.5 text-[12px] font-semibold">
                  Mashhur
                </span>
              )}
              <div
                className={`rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg h-full flex flex-col ${
                  plan.name === "pro" ? "border-primary shadow-lg ring-2 ring-primary/20" : ""
                }`}
              >
                <div className="text-center pt-6">
                  <div
                    className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl ${
                      planColors[plan.name] ?? "bg-muted"
                    }`}
                  >
                    {planIcons[plan.name]}
                  </div>
                  <h3 className="text-[16px] font-bold mb-1 capitalize text-xl">
                    {plan.name}
                  </h3>
                  <p className="text-[13px] text-muted-foreground mb-4">
                    <span className="text-3xl font-bold text-foreground">
                      {plan.price_uzs === 0
                        ? "Bepul"
                        : formatAmount(plan.price_uzs)}
                    </span>
                    {plan.price_uzs > 0 && (
                      <span className="text-muted-foreground"> /oy</span>
                    )}
                  </p>
                </div>
                <div className="flex-1">
                  <Separator className="mb-4" />
                  <ul className="space-y-3">
                    <Feature
                      label={`${plan.daily_requests} kunlik so'rov`}
                      included
                    />
                    <Feature
                      label="ML tahlil"
                      included={plan.ml_access}
                    />
                    <Feature
                      label="API kirish"
                      included={plan.api_access}
                    />
                    <Feature
                      label="Hujjat tahlili"
                      included={plan.document_analysis}
                    />
                    <Feature
                      label={`${
                        plan.max_saved_tenders === -1
                          ? "Cheksiz"
                          : plan.max_saved_tenders
                      } saqlangan tender`}
                      included
                    />
                    <Feature
                      label={`${plan.max_team_members} jamoa a'zosi`}
                      included
                    />
                  </ul>
                </div>
                <div className="pt-4">
                  <button
                    className={"w-full rounded-full px-6 py-2.5 text-[13px] font-semibold transition-all active:scale-[0.97] " + (isCurrent ? "border border-black/10 bg-white/70 backdrop-blur hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5" : "bg-[#1d1d1f] text-white hover:bg-[#333] hover:shadow-lg dark:bg-white dark:text-[#1d1d1f]")}
                    disabled={isCurrent}
                    onClick={() => {
                      toast.info(
                        "To'lov tizimi tez orada ishga tushadi. Click.uz yoki Payme orqali to'lash imkoniyati qo'shiladi."
                      );
                    }}
                  >
                    {isCurrent ? "Joriy reja" : "Tanlash"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Feature({
  label,
  included,
}: {
  label: string;
  included: boolean;
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <Check
        className={`h-4 w-4 ${
          included ? "text-primary" : "text-muted-foreground/30"
        }`}
      />
      <span className={included ? "" : "text-muted-foreground line-through"}>
        {label}
      </span>
    </li>
  );
}
