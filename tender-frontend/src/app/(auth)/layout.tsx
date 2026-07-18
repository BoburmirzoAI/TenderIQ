"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { FileSearch, Shield, BarChart3, Brain } from "lucide-react";

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
      {/* Left dark panel */}
      <div className="relative hidden flex-col justify-center overflow-hidden p-[60px] text-white lg:flex lg:flex-1 bg-[#020617]">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="pointer-events-none absolute right-[-100px] top-[-100px] h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-[-150px] left-[-100px] h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[120px]" />

        <div className="relative z-10">
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400 text-sm font-extrabold text-slate-950">
              TQ
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              Tender<span className="text-sky-400">IQ</span>
            </span>
          </div>

          <h2 className="mb-4 text-[40px] font-extrabold leading-[1.15] tracking-[-0.03em]">
            Tenderlarni aqlli
            <br />
            boshqaring.
          </h2>
          <p className="mb-10 max-w-[380px] text-base leading-[1.6] text-slate-400">
            O&apos;zbekistondagi barcha tender e&apos;lonlarini bir joyda kuzating,
            tahlil qiling va g&apos;alaba qozoning.
          </p>

          <div className="space-y-4">
            {features.map((f, i) => {
              const colors = ["bg-sky-400/10 text-sky-400", "bg-indigo-400/10 text-indigo-400", "bg-emerald-400/10 text-emerald-400", "bg-amber-400/10 text-amber-400"];
              return (
                <div key={i} className="flex items-center gap-3.5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 ${colors[i]}`}>
                    <f.icon className="h-[18px] w-[18px]" />
                  </div>
                  <span className="text-sm text-slate-300">{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-[#f5f5f7] dark:bg-slate-900 p-10">
        {children}
      </div>
    </div>
  );
}
