"use client";

import { useState } from "react";
import { Send, Phone, Mail, MapPin, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError("Barcha majburiy maydonlarni to'ldiring");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/v1/contact", form);
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Xatolik yuz berdi. Keyinroq urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const update = (key: keyof ContactForm, val: string) => setForm({ ...form, [key]: val });

  if (sent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-12">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Murojaatingiz qabul qilindi!</h2>
            <p className="text-muted-foreground mb-6">Biz tez orada siz bilan bog'lanamiz.</p>
            <Button onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}>
              Yangi murojaat
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Biz bilan bog'laning</h1>
        <p className="text-muted-foreground">Savolingiz bormi? Biz yordam berishga tayyormiz.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Murojaat formasi</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Ism *</label>
                    <Input placeholder="To'liq ismingiz" value={form.name} onChange={(e) => update("name", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Email *</label>
                    <Input type="email" placeholder="email@misol.uz" value={form.email} onChange={(e) => update("email", e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Telefon</label>
                    <Input placeholder="+998 90 123 45 67" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Mavzu *</label>
                    <Input placeholder="Murojaat mavzusi" value={form.subject} onChange={(e) => update("subject", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Xabar *</label>
                  <textarea
                    className="flex min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Xabaringizni yozing..."
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? "Yuborilmoqda..." : <><Send className="h-4 w-4 mr-2" /> Yuborish</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Telefon</p>
                  <p className="text-sm text-muted-foreground">+998 71 200 00 00</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">info@tenderiq.uz</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Manzil</p>
                  <p className="text-sm text-muted-foreground">Toshkent sh., Amir Temur ko'chasi</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-blue-900">Ish vaqti</p>
              <p className="text-sm text-blue-700 mt-1">Dushanba — Juma: 9:00 — 18:00</p>
              <p className="text-sm text-blue-700">Shanba: 9:00 — 14:00</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
