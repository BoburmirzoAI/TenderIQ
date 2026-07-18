"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/v1/auth/forgot-password", { email });
      setSent(true);
    } catch {
      toast.error("Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-[400px] text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <Mail className="h-7 w-7 text-green-600" />
        </div>
        <h1 className="mb-2 text-xl font-bold">Email yuborildi</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Agar <strong>{email}</strong> tizimda ro&apos;yxatdan o&apos;tgan bo&apos;lsa, parolni tiklash havolasi yuborildi.
        </p>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          className="mb-4 h-12 w-full rounded-xl border border-black/10 bg-white text-[15px] font-medium text-foreground transition-colors hover:bg-gray-50 cursor-pointer"
          style={{ fontFamily: "inherit" }}
        >
          Boshqa email bilan urinish
        </button>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-sky-400"
        >
          <ArrowLeft className="h-3 w-3" /> Loginga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="mb-1.5 text-[28px] font-extrabold tracking-[-0.03em]">
        Parolni tiklash
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Email manzilingizni kiriting — tiklash havolasini yuboramiz
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

        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 w-full rounded-xl border-none bg-sky-400 text-[15px] font-bold text-slate-950 transition-all hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] disabled:opacity-50 cursor-pointer"
          style={{ fontFamily: "inherit" }}
        >
          {loading ? "Yuborilmoqda..." : "Havolani yuborish"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground no-underline hover:text-sky-400"
        >
          <ArrowLeft className="h-3 w-3" /> Loginga qaytish
        </Link>
      </div>
    </div>
  );
}
