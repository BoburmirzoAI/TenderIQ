"use client";

import { useEffect, useState } from "react";
import { Headphones, Plus, Send, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";

interface Ticket {
  id: number;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  messages: { id: number; message: string; user_name: string | null; is_staff: boolean; created_at: string }[];
  created_at: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  open: { label: "Ochiq", color: "bg-sky-100 text-sky-600" },
  in_progress: { label: "Jarayonda", color: "bg-yellow-100 text-yellow-700" },
  waiting: { label: "Kutilmoqda", color: "bg-orange-100 text-orange-700" },
  resolved: { label: "Hal qilindi", color: "bg-green-100 text-green-700" },
  closed: { label: "Yopildi", color: "bg-slate-100 text-slate-700" },
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [form, setForm] = useState({ subject: "", description: "", category: "general", priority: "medium" });

  const load = () => {
    api.get("/v1/support").then((r) => setTickets(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const createTicket = async () => {
    try {
      await api.post("/v1/support", form);
      toast.success("Ticket yaratildi");
      setCreating(false);
      setForm({ subject: "", description: "", category: "general", priority: "medium" });
      load();
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    try {
      await api.post(`/v1/support/${selected.id}/messages`, { message: reply });
      setReply("");
      const r = await api.get(`/v1/support/${selected.id}`);
      setSelected(r.data.data);
      toast.success("Xabar yuborildi");
    } catch {
      toast.error("Xatolik");
    }
  };

  if (selected) {
    const st = statusMap[selected.status] || statusMap.open;
    return (
      <div className="space-y-6">
        <button onClick={() => { setSelected(null); load(); }} className="text-sm text-sky-500 hover:underline">
          &larr; Orqaga
        </button>
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold mb-1">{selected.subject}</h3>
            <span className={"rounded-full px-2.5 py-0.5 text-[12px] font-semibold " + st.color}>{st.label}</span>
          </div>
          <p className="text-sm text-muted-foreground">{selected.description}</p>
          <div className="space-y-4 mt-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selected.messages.map((m) => (
                <div key={m.id} className={`rounded-lg p-3 ${m.is_staff ? "bg-sky-50 ml-8" : "bg-muted mr-8"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">
                      {m.is_staff ? "Texnik yordam" : m.user_name || "Siz"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleString("uz")}
                    </span>
                  </div>
                  <p className="text-sm">{m.message}</p>
                </div>
              ))}
            </div>
            {selected.status !== "closed" && (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Javob yozing..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="min-h-[80px]"
                />
                <button className="rounded-xl bg-[#1d1d1f] text-white h-20 w-12 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f] inline-flex items-center justify-center" onClick={sendReply}>
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (creating) {
    return (
      <div className="space-y-6">
        <button onClick={() => setCreating(false)} className="text-sm text-sky-500 hover:underline">
          &larr; Orqaga
        </button>
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <h3 className="text-[16px] font-bold mb-1">Yangi ticket</h3>
          <div className="space-y-4 mt-4">
            <input className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10" placeholder="Mavzu" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <Textarea
              placeholder="Muammo tavsifi (kamida 10 belgi)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="min-h-[120px]"
            />
            <div className="grid grid-cols-2 gap-4">
              <Select value={form.category} onValueChange={(v: string | null) => setForm({ ...form, category: v ?? "general" })}>
                <SelectTrigger><SelectValue placeholder="Kategoriya" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Umumiy</SelectItem>
                  <SelectItem value="technical">Texnik</SelectItem>
                  <SelectItem value="billing">To&apos;lov</SelectItem>
                  <SelectItem value="tender">Tender</SelectItem>
                  <SelectItem value="account">Hisob</SelectItem>
                  <SelectItem value="bug">Xatolik</SelectItem>
                  <SelectItem value="feature">Yangi funksiya</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.priority} onValueChange={(v: string | null) => setForm({ ...form, priority: v ?? "medium" })}>
                <SelectTrigger><SelectValue placeholder="Muhimlik" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Past</SelectItem>
                  <SelectItem value="medium">O&apos;rta</SelectItem>
                  <SelectItem value="high">Yuqori</SelectItem>
                  <SelectItem value="urgent">Shoshilinch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button className="rounded-full bg-[#1d1d1f] text-white px-6 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f] disabled:opacity-50" onClick={createTicket} disabled={!form.subject || form.description.length < 10}>
              Yuborish
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Texnik yordam</h1>
          <p className="text-sm text-muted-foreground mt-1">Muammolaringizni hal qiling</p>
        </div>
        <button className="rounded-full bg-[#1d1d1f] text-white px-6 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f]" onClick={() => setCreating(true)}>
          <span className="inline-flex items-center"><Plus className="mr-2 h-4 w-4" /> Yangi ticket</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl py-16 text-center dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all">
          <Headphones className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Hozircha ticket yo&apos;q</p>
          <button className="rounded-full bg-[#1d1d1f] text-white px-6 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f] mt-4" onClick={() => setCreating(true)}>Yangi ticket yaratish</button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const st = statusMap[t.status] || statusMap.open;
            return (
              <div
                key={t.id}
                className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all cursor-pointer hover:shadow-md hover:border-sky-200"
                onClick={() => setSelected(t)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{t.subject}</p>
                      <span className={"rounded-full px-2.5 py-0.5 text-[12px] font-semibold " + st.color}>{st.label}</span>
                      <span className="rounded-full border border-black/10 dark:border-white/10 px-2.5 py-0.5 text-[12px] font-semibold">{t.category}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{t.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> {t.messages.length}
                    </span>
                    <span>{new Date(t.created_at).toLocaleDateString("uz")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
