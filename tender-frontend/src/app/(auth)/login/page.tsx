"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { UzexLogin } from "@/components/auth/uzex-login";

function BasicLogin() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Muvaffaqiyatli kirildi!");
      router.push("/dashboard");
    } catch {
      toast.error("Email yoki parol noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8 text-center lg:hidden">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-slate-950 bg-sky-400">
          TQ
        </div>
        <h1 className="text-xl font-extrabold">Tender<span className="text-sky-400">IQ</span></h1>
      </div>

      <h1 className="mb-1.5 text-[28px] font-extrabold tracking-[-0.03em]">
        Kirish
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Hisobingizga kiring va tenderlarni kuzating
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label className="mb-[7px] block text-[13px] font-semibold text-muted-foreground">
            Email
          </label>
          <input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-sky-400 focus:ring-[3px] focus:ring-sky-400/[0.12] dark:bg-slate-950 dark:border-white/10"
            style={{ fontFamily: "inherit" }}
          />
        </div>

        <div className="mb-5">
          <div className="mb-[7px] flex items-center justify-between">
            <label className="text-[13px] font-semibold text-muted-foreground">
              Parol
            </label>
            <Link
              href="/forgot-password"
              className="text-[13px] font-medium text-sky-500 dark:text-sky-400 no-underline"
            >
              Parolni unutdingizmi?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Parolingizni kiriting"
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
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 w-full rounded-xl border-none bg-sky-400 text-[15px] font-bold text-slate-950 transition-all hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] disabled:opacity-50 cursor-pointer"
          style={{ fontFamily: "inherit" }}
        >
          {loading ? "Kirish..." : "Kirish"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        yoki
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-black/10 bg-white text-sm font-medium text-foreground transition-colors hover:bg-gray-50 cursor-pointer"
        style={{ fontFamily: "inherit" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google bilan kirish
      </button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Hisobingiz yo&apos;qmi?{" "}
        <Link
          href="/register"
          className="font-semibold text-sky-500 dark:text-sky-400 no-underline"
        >
          Ro&apos;yxatdan o&apos;tish
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  const { authMode, fetchAuthMode } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchAuthMode().finally(() => setReady(true));
  }, [fetchAuthMode]);

  if (!ready) return null;

  return authMode === "uzex" ? <UzexLogin /> : <BasicLogin />;
}
