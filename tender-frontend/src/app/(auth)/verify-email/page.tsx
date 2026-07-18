"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import api from "@/lib/api";

type Status = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setErrorMsg("Token topilmadi"); return; }
    api.post("/v1/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch((err) => {
        setErrorMsg(err?.response?.data?.detail || "Token yaroqsiz yoki muddati o'tgan");
        setStatus("error");
      });
  }, [token]);

  return (
    <div className="w-full max-w-[400px] text-center">
      {status === "loading" && (
        <>
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-sky-400" />
          <h1 className="mb-2 text-xl font-bold">Tekshirilmoqda...</h1>
          <p className="text-sm text-muted-foreground">
            Email manzilingiz tasdiqlanmoqda
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mb-2 text-xl font-bold">Email tasdiqlandi!</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Email manzilingiz muvaffaqiyatli tasdiqlandi.
          </p>
          <Link href="/dashboard">
            <button
              className="h-12 w-full rounded-xl border-none bg-sky-400 text-[15px] font-bold text-slate-950 transition-all hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] cursor-pointer"
              style={{ fontFamily: "inherit" }}
            >
              Bosh sahifaga o&apos;tish
            </button>
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mb-2 text-xl font-bold">Tasdiqlab bo&apos;lmadi</h1>
          <p className="mb-8 text-sm text-muted-foreground">{errorMsg}</p>
          <Link href="/dashboard">
            <button
              className="mb-4 h-12 w-full rounded-xl border-none bg-sky-400 text-[15px] font-bold text-slate-950 transition-all hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] cursor-pointer"
              style={{ fontFamily: "inherit" }}
            >
              Bosh sahifaga qaytish
            </button>
          </Link>
          <p className="text-xs text-muted-foreground">
            Yangi havola olish uchun Sozlamalar → Xavfsizlik bo&apos;limiga o&apos;ting
          </p>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-400 border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
