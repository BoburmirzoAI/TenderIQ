"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth";

export default function LoginPage() {
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
    <div className="w-full max-w-[420px]">
      <div className="text-center mb-8 lg:hidden">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg">
          TQ
        </div>
        <h1 className="text-xl font-bold">TenderIQ</h1>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader className="pb-2 pt-8 px-8">
          <h2 className="text-2xl font-bold tracking-tight">Kirish</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Hisobingizga kiring va tenderlarni kuzating
          </p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-8">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Parol</Label>
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                  Parolni unutdingizmi?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Parolingizni kiriting"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 px-8 pb-8">
            <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={loading}>
              {loading ? "Kirish..." : <><LogIn className="h-4 w-4 mr-2" /> Kirish</>}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Hisobingiz yo&apos;qmi?{" "}
              <Link href="/register" className="text-blue-600 font-medium hover:underline">
                Ro&apos;yxatdan o&apos;tish
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
