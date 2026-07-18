"use client";

import { useState } from "react";
import { Send, Phone, Mail, MapPin, CheckCircle } from "lucide-react";
import api from "@/lib/api";

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

function AppleInput({ placeholder, value, onChange, type = "text" }: { placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string }) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[15px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10" />
  );
}

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) { setError("Barcha majburiy maydonlarni to'ldiring"); return; }
    setLoading(true); setError("");
    try { await api.post("/v1/contact", form); setSent(true); }
    catch (err: unknown) { const e = err as { response?: { data?: { detail?: string } } }; setError(e?.response?.data?.detail || "Xatolik yuz berdi."); }
    finally { setLoading(false); }
  };

  const update = (key: keyof ContactForm, val: string) => setForm({ ...form, [key]: val });

  if (sent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-12 max-w-md w-full text-center dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-[20px] font-extrabold mb-2">Murojaatingiz qabul qilindi!</h2>
          <p className="text-[13px] text-muted-foreground mb-6">Biz tez orada siz bilan bog&apos;lanamiz.</p>
          <button onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}
            className="rounded-full bg-[#1d1d1f] text-white px-6 py-2.5 text-[14px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f]">
            Yangi murojaat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Biz bilan bog&apos;laning</h1>
        <p className="text-[14px] text-muted-foreground mt-1">Savolingiz bormi? Biz yordam berishga tayyormiz.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <h3 className="text-[16px] font-bold mb-5">Murojaat formasi</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Ism *</label>
                  <AppleInput placeholder="To'liq ismingiz" value={form.name} onChange={(e) => update("name", e.target.value)} />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Email *</label>
                  <AppleInput type="email" placeholder="email@misol.uz" value={form.email} onChange={(e) => update("email", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Telefon</label>
                  <AppleInput placeholder="+998 90 123 45 67" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Mavzu *</label>
                  <AppleInput placeholder="Murojaat mavzusi" value={form.subject} onChange={(e) => update("subject", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Xabar *</label>
                <textarea
                  className="w-full min-h-[140px] rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-[15px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 resize-none dark:bg-white/5 dark:border-white/10"
                  placeholder="Xabaringizni yozing..."
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                />
              </div>
              {error && <p className="text-[13px] text-red-500">{error}</p>}
              <button type="submit" disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-[#1d1d1f] text-white px-6 py-2.5 text-[14px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] disabled:opacity-50 dark:bg-white dark:text-[#1d1d1f]">
                {loading ? "Yuborilmoqda..." : <><Send className="h-3.5 w-3.5" /> Yuborish</>}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { icon: Phone, label: "Telefon", value: "+998 71 200 00 00", color: "text-sky-400", bg: "bg-sky-400/10" },
            { icon: Mail, label: "Email", value: "info@tenderiq.uz", color: "text-green-500", bg: "bg-green-500/10" },
            { icon: MapPin, label: "Manzil", value: "Toshkent sh., Amir Temur ko'chasi", color: "text-purple-500", bg: "bg-purple-500/10" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold">{item.label}</p>
                  <p className="text-[12px] text-muted-foreground">{item.value}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="rounded-2xl border border-sky-200 bg-sky-50/60 backdrop-blur-xl p-5 dark:border-sky-400/20 dark:bg-sky-400/5">
            <p className="text-[14px] font-semibold text-sky-900 dark:text-sky-400">Ish vaqti</p>
            <p className="text-[12px] text-sky-600 dark:text-sky-300 mt-1">Dushanba — Juma: 9:00 — 18:00</p>
            <p className="text-[12px] text-sky-600 dark:text-sky-300">Shanba: 9:00 — 14:00</p>
          </div>
        </div>
      </div>
    </div>
  );
}
