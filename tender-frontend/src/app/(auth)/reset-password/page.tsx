"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Eye, EyeOff, Lock, XCircle } from "lucide-react";
import api from "@/lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { if (!token) toast.error("Token topilmadi"); }, [token]);

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
      <div className="w-full max-w-[420px]">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold">Havola yaroqsiz</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Parolni tiklash havolasi topilmadi. Qaytadan so&apos;rov yuboring.
            </p>
          </CardHeader>
          <CardFooter className="px-8 pb-8">
            <Link href="/forgot-password" className="w-full">
              <Button className="w-full h-11">Qayta so&apos;rov yuborish</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-[420px]">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Parol yangilandi</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Parolingiz muvaffaqiyatli o&apos;zgartirildi.
            </p>
          </CardHeader>
          <CardFooter className="px-8 pb-8">
            <Button className="w-full h-11" onClick={() => router.push("/login")}>Kirish</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px]">
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-2 pt-8 px-8">
          <h2 className="text-2xl font-bold tracking-tight">Yangi parol</h2>
          <p className="text-sm text-muted-foreground mt-1">Yangi parolni kiriting</p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-8">
            <div className="space-y-2">
              <Label htmlFor="password">Yangi parol</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Kamida 8 ta belgi" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Parolni tasdiqlang</Label>
              <Input id="confirm" type="password" placeholder="Parolni qayta kiriting" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="h-11" />
            </div>
            {confirm && password !== confirm && (
              <p className="text-sm text-red-500">Parollar mos kelmaydi</p>
            )}
          </CardContent>
          <CardFooter className="px-8 pb-8">
            <Button type="submit" className="w-full h-11" disabled={loading || (!!confirm && password !== confirm)}>
              {loading ? "Saqlanmoqda..." : <><Lock className="h-4 w-4 mr-2" /> Parolni saqlash</>}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
