"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import api from "@/lib/api";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
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
    <div className="w-full max-w-[420px]">
      <Card className="shadow-lg border-0">
        {status === "loading" && (
          <CardHeader className="text-center py-12">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-bold">Tekshirilmoqda...</h2>
            <p className="text-sm text-muted-foreground mt-2">Email manzilingiz tasdiqlanmoqda</p>
          </CardHeader>
        )}
        {status === "success" && (
          <>
            <CardHeader className="text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold">Email tasdiqlandi!</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Email manzilingiz muvaffaqiyatli tasdiqlandi.
              </p>
            </CardHeader>
            <CardFooter className="px-8 pb-8">
              <Link href="/dashboard" className="w-full">
                <Button className="w-full h-11">Bosh sahifaga o&apos;tish</Button>
              </Link>
            </CardFooter>
          </>
        )}
        {status === "error" && (
          <>
            <CardHeader className="text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold">Tasdiqlab bo&apos;lmadi</h2>
              <p className="text-sm text-muted-foreground mt-2">{errorMsg}</p>
            </CardHeader>
            <CardFooter className="flex flex-col gap-3 px-8 pb-8">
              <Link href="/dashboard" className="w-full">
                <Button className="w-full h-11">Bosh sahifaga qaytish</Button>
              </Link>
              <p className="text-xs text-muted-foreground text-center">
                Yangi havola olish uchun Sozlamalar → Xavfsizlik bo&apos;limiga o&apos;ting
              </p>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
