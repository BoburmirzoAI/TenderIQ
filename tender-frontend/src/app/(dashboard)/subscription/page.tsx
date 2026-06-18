"use client";

import { useEffect, useState } from "react";
import { Check, Crown, Zap, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <h1 className="text-2xl font-bold tracking-tight">Obuna boshqaruvi</h1>
        <p className="text-muted-foreground">
          Rejangizni tanlang va imkoniyatlaringizni kengaytiring
        </p>
      </div>

      {usage && (
        <Card>
          <CardHeader>
            <CardTitle>Joriy foydalanish</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.name === currentPlan;
          return (
            <div key={plan.name} className="relative pt-4">
              {plan.name === "pro" && (
                <Badge className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                  Mashhur
                </Badge>
              )}
              <Card
                className={`h-full flex flex-col ${
                  plan.name === "pro" ? "border-primary shadow-lg ring-2 ring-primary/20" : ""
                }`}
              >
                <CardHeader className="text-center pt-6">
                  <div
                    className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl ${
                      planColors[plan.name] ?? "bg-muted"
                    }`}
                  >
                    {planIcons[plan.name]}
                  </div>
                  <CardTitle className="capitalize text-xl">
                    {plan.name}
                  </CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">
                      {plan.price_uzs === 0
                        ? "Bepul"
                        : formatAmount(plan.price_uzs)}
                    </span>
                    {plan.price_uzs > 0 && (
                      <span className="text-muted-foreground"> /oy</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
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
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent}
                    onClick={() => {
                      toast.info(
                        "To'lov tizimi tez orada ishga tushadi. Click.uz yoki Payme orqali to'lash imkoniyati qo'shiladi."
                      );
                    }}
                  >
                    {isCurrent ? "Joriy reja" : "Tanlash"}
                  </Button>
                </CardFooter>
              </Card>
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
