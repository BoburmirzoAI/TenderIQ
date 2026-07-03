"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { FileSearch, Shield, BarChart3, Brain, CheckCircle2 } from "lucide-react";

const features = [
  { icon: FileSearch, text: "Minglab tenderlarni real vaqtda kuzating" },
  { icon: Brain, text: "AI tavsiyalar — sizga mos tenderlarni toping" },
  { icon: BarChart3, text: "Bozor tahlili va raqobatchilar monitoringi" },
  { icon: Shield, text: "Xavfsiz va ishonchli platforma" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, initialized, init } = useAuthStore();

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (initialized && isAuthenticated) router.push("/dashboard");
  }, [initialized, isAuthenticated, router]);

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 font-bold text-lg">
              TQ
            </div>
            <span className="text-2xl font-bold tracking-tight">TenderIQ</span>
          </div>
          <p className="text-blue-200 text-sm">Tender Intelligence Platform</p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight">
              Tenderlarni aqlli<br />boshqaring
            </h2>
            <p className="mt-3 text-blue-100 leading-relaxed max-w-md">
              O'zbekistondagi barcha tender e'lonlarini bir joyda kuzating,
              tahlil qiling va g'alaba qozoning.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <f.icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-blue-100">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-blue-200 text-xs">
          <span>&copy; 2024 TenderIQ</span>
          <span>&bull;</span>
          <span>Barcha huquqlar himoyalangan</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 bg-slate-50">
        {children}
      </div>
    </div>
  );
}
