"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Send } from "lucide-react";
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
      <div className="w-full max-w-[420px]">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pt-8 px-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <Mail className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Email yuborildi</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Agar <strong>{email}</strong> tizimda ro&apos;yxatdan o&apos;tgan bo&apos;lsa, parolni tiklash havolasi yuborildi.
            </p>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3 px-8 pb-8">
            <Button variant="outline" className="w-full h-11" onClick={() => { setSent(false); setEmail(""); }}>
              Boshqa email bilan urinish
            </Button>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-blue-600 flex items-center gap-1 justify-center">
              <ArrowLeft className="h-3 w-3" /> Loginga qaytish
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px]">
      <Card className="shadow-lg border-0">
        <CardHeader className="pb-2 pt-8 px-8">
          <h2 className="text-2xl font-bold tracking-tight">Parolni tiklash</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Email manzilingizni kiriting — tiklash havolasini yuboramiz
          </p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-8">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 px-8 pb-8">
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Yuborilmoqda..." : <><Send className="h-4 w-4 mr-2" /> Havolani yuborish</>}
            </Button>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-blue-600 flex items-center gap-1 justify-center">
              <ArrowLeft className="h-3 w-3" /> Loginga qaytish
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
