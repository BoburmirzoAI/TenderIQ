"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth";

export default function RegisterPage() {
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
    } catch {
      toast.error("Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px]">
      <div className="text-center mb-8 lg:hidden">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg">
          TQ
        </div>
        <h1 className="text-xl font-bold">TenderIQ</h1>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader className="pb-2 pt-8 px-8">
          <h2 className="text-2xl font-bold tracking-tight">Ro&apos;yxatdan o&apos;tish</h2>
          <p className="text-sm text-muted-foreground mt-1">
            TenderIQ platformasiga qo&apos;shiling — bepul boshlang
          </p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-8">
            <div className="space-y-2">
              <Label htmlFor="full_name">To&apos;liq ism</Label>
              <Input id="full_name" placeholder="Ism Familiya" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@misol.uz" value={form.email} onChange={(e) => update("email", e.target.value)} required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" type="tel" placeholder="+998 90 123 45 67" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Kamida 8 ta belgi" value={form.password} onChange={(e) => update("password", e.target.value)} required className="h-11 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Parolni tasdiqlang</Label>
              <Input id="confirmPassword" type="password" placeholder="Parolni qayta kiriting" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required className="h-11" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 px-8 pb-8">
            <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={loading}>
              {loading ? "Yaratilmoqda..." : <><UserPlus className="h-4 w-4 mr-2" /> Hisob yaratish</>}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Hisobingiz bormi?{" "}
              <Link href="/login" className="text-blue-600 font-medium hover:underline">
                Kirish
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
