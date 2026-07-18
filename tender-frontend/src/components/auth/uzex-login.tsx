"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, UsbIcon } from "lucide-react";
import { useAuthStore } from "@/store/auth";

type LoginMethod = "eri" | "password" | "usb";

export function UzexLogin() {
  const router = useRouter();
  const uzexLogin = useAuthStore((s) => s.uzexLogin);
  const [method, setMethod] = useState<LoginMethod>("password");
  const [inn, setInn] = useState("");
  const [password, setPassword] = useState("");
  const [eriKey, setEriKey] = useState("");
  const [usbToken, setUsbToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (method === "password") {
        if (!inn.trim() || !password.trim()) {
          toast.error("INN va parolni kiriting");
          return;
        }
        await uzexLogin({ inn: inn.trim(), password });
      } else if (method === "eri") {
        if (!eriKey.trim()) {
          toast.error("ERI kalitni tanlang");
          return;
        }
        await uzexLogin({ eri_key_serial: eriKey.trim() });
      } else {
        if (!usbToken.trim()) {
          toast.error("USB tokenni ulang");
          return;
        }
        await uzexLogin({ usb_token_id: usbToken.trim() });
      }
      toast.success("Muvaffaqiyatli kirildi!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || "Kirish xatosi");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-sky-400 focus:ring-[3px] focus:ring-sky-400/[0.12] dark:bg-slate-950 dark:border-white/10";

  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-8 text-center lg:hidden">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-slate-950 bg-sky-400">
          TQ
        </div>
        <h1 className="text-xl font-extrabold">
          Tender<span className="text-sky-400">IQ</span>
        </h1>
      </div>

      <h1 className="mb-1.5 text-[28px] font-extrabold tracking-[-0.03em]">
        Avtorizatsiya
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Tizimga kirish uchun ERI kalit, USB token yoki login/parol usulini tanlang
      </p>

      {/* Method tabs */}
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setMethod("password")}
          className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
            method === "password"
              ? "border-sky-400 bg-sky-400/10 text-sky-500"
              : "border-black/10 dark:border-white/10 text-muted-foreground hover:border-sky-400/50"
          }`}
          style={{ fontFamily: "inherit" }}
        >
          <KeyRound className="h-4 w-4" />
          Login / Parol
        </button>
        <button
          type="button"
          onClick={() => setMethod("eri")}
          className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
            method === "eri"
              ? "border-sky-400 bg-sky-400/10 text-sky-500"
              : "border-black/10 dark:border-white/10 text-muted-foreground hover:border-sky-400/50"
          }`}
          style={{ fontFamily: "inherit" }}
        >
          <KeyRound className="h-4 w-4" />
          ERI kalit
        </button>
        <button
          type="button"
          onClick={() => setMethod("usb")}
          className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
            method === "usb"
              ? "border-sky-400 bg-sky-400/10 text-sky-500"
              : "border-black/10 dark:border-white/10 text-muted-foreground hover:border-sky-400/50"
          }`}
          style={{ fontFamily: "inherit" }}
        >
          <UsbIcon className="h-4 w-4" />
          USB token
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {method === "password" && (
          <>
            <div className="mb-5">
              <label className="mb-[7px] block text-[13px] font-semibold text-muted-foreground">
                INN (STIR)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Tashkilot INN raqami"
                value={inn}
                onChange={(e) => setInn(e.target.value.replace(/\D/g, "").slice(0, 14))}
                required
                className={inputClass}
                style={{ fontFamily: "inherit" }}
              />
            </div>
            <div className="mb-5">
              <label className="mb-[7px] block text-[13px] font-semibold text-muted-foreground">
                Parol
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Parolingizni kiriting"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputClass} pr-10`}
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
          </>
        )}

        {method === "eri" && (
          <div className="mb-5">
            <label className="mb-[7px] block text-[13px] font-semibold text-muted-foreground">
              ERI kalit tanlang
            </label>
            <select
              value={eriKey}
              onChange={(e) => setEriKey(e.target.value)}
              required
              className={inputClass}
              style={{ fontFamily: "inherit" }}
            >
              <option value="">Kalitni tanlang...</option>
              <option value="demo_eri_key">Demo ERI kalit</option>
            </select>
            <p className="mt-2 text-xs text-muted-foreground">
              E-IMZO dasturi o&apos;rnatilgan bo&apos;lishi kerak
            </p>
          </div>
        )}

        {method === "usb" && (
          <div className="mb-5">
            <label className="mb-[7px] block text-[13px] font-semibold text-muted-foreground">
              USB token / ID-karta
            </label>
            <select
              value={usbToken}
              onChange={(e) => setUsbToken(e.target.value)}
              required
              className={inputClass}
              style={{ fontFamily: "inherit" }}
            >
              <option value="">Qurilmani tanlang...</option>
              <option value="demo_usb_token">Demo USB token</option>
            </select>
            <p className="mt-2 text-xs text-muted-foreground">
              USB kalitni kompyuterga ulang va qurilmani tanlang
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 w-full rounded-xl border-none bg-sky-400 text-[15px] font-bold text-slate-950 transition-all hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] disabled:opacity-50 cursor-pointer"
          style={{ fontFamily: "inherit" }}
        >
          {loading ? "Kirish..." : "Kirish"}
        </button>
      </form>

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
