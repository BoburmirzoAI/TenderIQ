"use client";

import { useEffect, useState } from "react";
import { Headphones, Plus, Send, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  open: { label: "Ochiq", color: "bg-blue-100 text-blue-700" },
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
        <button onClick={() => { setSelected(null); load(); }} className="text-sm text-blue-600 hover:underline">
          &larr; Orqaga
        </button>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selected.subject}</CardTitle>
              <Badge className={st.color}>{st.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{selected.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selected.messages.map((m) => (
                <div key={m.id} className={`rounded-lg p-3 ${m.is_staff ? "bg-blue-50 ml-8" : "bg-muted mr-8"}`}>
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
                <Button onClick={sendReply} size="icon" className="h-20 w-12">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (creating) {
    return (
      <div className="space-y-6">
        <button onClick={() => setCreating(false)} className="text-sm text-blue-600 hover:underline">
          &larr; Orqaga
        </button>
        <Card>
          <CardHeader>
            <CardTitle>Yangi ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Mavzu" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
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
                  <SelectItem value="billing">To'lov</SelectItem>
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
                  <SelectItem value="medium">O'rta</SelectItem>
                  <SelectItem value="high">Yuqori</SelectItem>
                  <SelectItem value="urgent">Shoshilinch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createTicket} disabled={!form.subject || form.description.length < 10}>
              Yuborish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Texnik yordam</h1>
          <p className="text-muted-foreground">Muammolaringizni hal qiling</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> Yangi ticket
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="py-16 text-center">
          <Headphones className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">Hozircha ticket yo'q</p>
          <Button className="mt-4" onClick={() => setCreating(true)}>Yangi ticket yaratish</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const st = statusMap[t.status] || statusMap.open;
            return (
              <Card
                key={t.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-blue-200"
                onClick={() => setSelected(t)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{t.subject}</p>
                      <Badge className={st.color}>{st.label}</Badge>
                      <Badge variant="outline" className="text-xs">{t.category}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{t.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> {t.messages.length}
                    </span>
                    <span>{new Date(t.created_at).toLocaleDateString("uz")}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
