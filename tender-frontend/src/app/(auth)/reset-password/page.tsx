"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle, Eye, EyeOff, XCircle } from "lucide-react";
import api from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) toast.error("Token topilmadi");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Parollar mos kelmaydi"); return; }
    if (password.length < 8) { toast.error("Parol kamida 8 ta belgidan iborat bo'lishi kerak"); return; }
    setLoading(true);
    try {
      await api.post("/v1/auth/reset-password", { token, new_password: password });
      setDone(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || "Token yaroqsiz yoki muddati o'tgan");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-[400px] text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="mb-2 text-xl font-bold">Havola yaroqsiz</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Parolni tiklash havolasi topilmadi. Qaytadan so&apos;rov yuboring.
        </p>
        <Link href="/forgot-password">
          <button
            className="h-12 w-full rounded-xl border-none bg-sky-400 text-[15px] font-bold text-slate-950 transition-all hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] cursor-pointer"
            style={{ fontFamily: "inherit" }}
          >
            Qayta so&apos;rov yuborish
          </button>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-[400px] text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="mb-2 text-xl font-bold">Parol yangilandi</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Parolingiz muvaffaqiyatli o&apos;zgartirildi.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="h-12 w-full rounded-xl border-none bg-sky-400 text-[15px] font-bold text-slate-950 transition-all hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] cursor-pointer"
          style={{ fontFamily: "inherit" }}
        >
          Kirish
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="mb-1.5 text-[28px] font-extrabold tracking-[-0.03em]">
        Yangi parol
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Yangi parolni kiriting
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label className="mb-[7px] block text-[13px] font-semibold text-muted-foreground">
            Yangi parol
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Kamida 8 ta belgi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-sky-400 focus:ring-[3px] focus:ring-sky-400/[0.12] dark:bg-slate-950 dark:border-white/10"
            style={{ fontFamily: "inherit" }}
          />
          {confirm && password !== confirm && (
            <p className="mt-2 text-sm text-red-500">Parollar mos kelmaydi</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || (!!confirm && password !== confirm)}
          className="mt-2 h-12 w-full rounded-xl border-none bg-sky-400 text-[15px] font-bold text-slate-950 transition-all hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] disabled:opacity-50 cursor-pointer"
          style={{ fontFamily: "inherit" }}
        >
          {loading ? "Saqlanmoqda..." : "Parolni saqlash"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
