"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { UzexRegister } from "@/components/auth/uzex-register";

function BasicRegister() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Parollar mos kelmaydi"); return; }
    if (form.password.length < 8) { toast.error("Parol kamida 8 ta belgidan iborat bo'lishi kerak"); return; }
    setLoading(true);
    try {
      await register(form.email, form.password, form.full_name, form.phone || undefined);
      toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || "Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8 text-center lg:hidden">
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
          style={{ background: "#38bdf8" }}
        >
          TQ
        </div>
        <h1 className="text-xl font-bold">TenderIQ</h1>
      </div>

      <h1 className="mb-1.5 text-[28px] font-extrabold tracking-[-0.03em]">
        Ro&apos;yxatdan o&apos;tish
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        TenderIQ platformasiga qo&apos;shiling — bepul boshlang
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label className="mb-[7px] block text-[13px] font-semibold text-muted-foreground">
            To&apos;liq ism
          </label>
          <input
            placeholder="Ism Familiya"
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            required
            className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-sky-400 focus:ring-[3px] focus:ring-sky-400/[0.12] dark:bg-slate-950 dark:border-white/10"
            style={{ fontFamily: "inherit" }}
          />
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-[7px] block text-[13px] font-semibold text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              placeholder="email@misol.uz"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-sky-400 focus:ring-[3px] focus:ring-sky-400/[0.12] dark:bg-slate-950 dark:border-white/10"
              style={{ fontFamily: "inherit" }}
            />
          </div>
          <div>
            <label className="mb-[7px] block text-[13px] font-semibold text-muted-foreground">
              Telefon
            </label>
            <input
              type="tel"
              placeholder="+998 90 123 45 67"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-sky-400 focus:ring-[3px] focus:ring-sky-400/[0.12] dark:bg-slate-950 dark:border-white/10"
              style={{ fontFamily: "inherit" }}
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-[7px] block text-[13px] font-semibold text-muted-foreground">
            Parol
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Kamida 8 ta belgi"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 pr-10 text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-sky-400 focus:ring-[3px] focus:ring-sky-400/[0.12] dark:bg-slate-950 dark:border-white/10"
              style={{ fontFamily: "inherit" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-[7px] block text-[13px] font-semibold text-muted-foreground">
            Parolni tasdiqlang
          </label>
          <input
            type="password"
            placeholder="Parolni qayta kiriting"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            required
            className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-sky-400 focus:ring-[3px] focus:ring-sky-400/[0.12] dark:bg-slate-950 dark:border-white/10"
            style={{ fontFamily: "inherit" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 w-full rounded-xl border-none bg-sky-400 text-[15px] font-bold text-slate-950 transition-all hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] disabled:opacity-50 cursor-pointer"
          style={{ fontFamily: "inherit" }}
        >
          {loading ? "Yaratilmoqda..." : "Hisob yaratish"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Hisobingiz bormi?{" "}
        <Link href="/login" className="font-semibold text-sky-500 dark:text-sky-400 no-underline">
          Kirish
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const { authMode, fetchAuthMode } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchAuthMode().finally(() => setReady(true));
  }, [fetchAuthMode]);

  if (!ready) return null;

  return authMode === "uzex" ? <UzexRegister /> : <BasicRegister />;
}
