"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Save,
  Plus,
  Target,
  Bookmark,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { CATEGORIES, REGIONS } from "@/types";
import type { Company } from "@/types";

interface CompanyStats {
  total_matched: number;
  total_saved: number;
  avg_match_score: number;
  active_tenders: number;
}

export default function CompanyPage() {
  const [, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const [form, setForm] = useState({
    name: "",
    stir: "",
    description: "",
    categories: [] as string[],
    regions: [] as string[],
    min_amount: "",
    max_amount: "",
    keywords: "",
    contact_person: "",
    contact_phone: "",
    address: "",
    website: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/v1/companies/me");
        const c = data.data as Company;
        setCompany(c);
        setForm({
          name: c.name,
          stir: c.stir ?? "",
          description: c.description ?? "",
          categories: c.categories ?? [],
          regions: c.regions ?? [],
          min_amount: c.min_amount?.toString() ?? "",
          max_amount: c.max_amount?.toString() ?? "",
          keywords: c.keywords ?? "",
          contact_person: c.contact_person ?? "",
          contact_phone: c.contact_phone ?? "",
          address: c.address ?? "",
          website: c.website ?? "",
        });
        api
          .get("/v1/companies/stats")
          .then(({ data }) => setStats(data.data))
          .catch(() => {});
      } catch {
        setIsNew(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleArray = (field: "categories" | "regions", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        stir: form.stir || undefined,
        description: form.description || undefined,
        categories: form.categories.length ? form.categories : undefined,
        regions: form.regions.length ? form.regions : undefined,
        min_amount: form.min_amount ? parseFloat(form.min_amount) : undefined,
        max_amount: form.max_amount ? parseFloat(form.max_amount) : undefined,
        keywords: form.keywords || undefined,
        contact_person: form.contact_person || undefined,
        contact_phone: form.contact_phone || undefined,
        address: form.address || undefined,
        website: form.website || undefined,
      };

      if (isNew) {
        const { data } = await api.post("/v1/companies/", payload);
        setCompany(data.data);
        setIsNew(false);
        toast.success("Kompaniya profili yaratildi!");
      } else {
        const { data } = await api.patch("/v1/companies/me", payload);
        setCompany(data.data);
        toast.success("Profil yangilandi!");
      }
    } catch {
      toast.error("Saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const statCards = [
    { label: "Mos tenderlar", value: stats?.total_matched, icon: Target, gradient: "from-sky-400/10 to-sky-500/20 dark:from-sky-400/20 dark:to-sky-400/30", iconColor: "text-sky-500 dark:text-sky-400" },
    { label: "Saqlangan", value: stats?.total_saved, icon: Bookmark, gradient: "from-amber-500/10 to-amber-600/20 dark:from-amber-400/20 dark:to-amber-500/30", iconColor: "text-amber-600 dark:text-amber-400" },
    { label: "O'rtacha moslik", value: stats?.avg_match_score != null ? `${stats.avg_match_score.toFixed(0)}%` : "0%", icon: TrendingUp, gradient: "from-green-500/10 to-green-600/20 dark:from-green-400/20 dark:to-green-500/30", iconColor: "text-green-600 dark:text-green-400" },
    { label: "Faol tenderlar", value: stats?.active_tenders, icon: BarChart3, gradient: "from-purple-500/10 to-purple-600/20 dark:from-purple-400/20 dark:to-purple-500/30", iconColor: "text-purple-600 dark:text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">Kompaniya profili</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          {isNew
            ? "Kompaniya profilingizni yarating"
            : "Kompaniya ma'lumotlaringizni boshqaring"}
        </p>
      </div>

      {!isNew && stats && (
        <div className="grid gap-4 md:grid-cols-4">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg hover:scale-[1.01]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-muted-foreground">{s.label}</span>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient}`}>
                    <Icon className={`h-4 w-4 ${s.iconColor}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight">{s.value}</div>
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic info */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <h3 className="text-[15px] font-semibold flex items-center gap-2 mb-5">
              <Building2 className="h-5 w-5" />
              Asosiy ma&apos;lumotlar
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Kompaniya nomi *</Label>
                <input
                  id="name"
                  className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stir">STIR (soliq raqami)</Label>
                <input
                  id="stir"
                  className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                  value={form.stir}
                  onChange={(e) => update("stir", e.target.value)}
                  maxLength={9}
                  placeholder="123456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Tavsif</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[100px] rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10 resize-y"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">
                  Kalit so&apos;zlar (vergul bilan ajratilgan)
                </Label>
                <input
                  id="keywords"
                  className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                  value={form.keywords}
                  onChange={(e) => update("keywords", e.target.value)}
                  placeholder="qurilish, ta'mirlash, loyiha"
                />
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <h3 className="text-[15px] font-semibold mb-5">Aloqa ma&apos;lumotlari</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person">Mas&apos;ul shaxs</Label>
                <input
                  id="contact_person"
                  className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                  value={form.contact_person}
                  onChange={(e) => update("contact_person", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefon</Label>
                <input
                  id="contact_phone"
                  className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                  value={form.contact_phone}
                  onChange={(e) => update("contact_phone", e.target.value)}
                  placeholder="+998 90 123 45 67"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Manzil</Label>
                <input
                  id="address"
                  className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Veb-sayt</Label>
                <input
                  id="website"
                  className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                  placeholder="https://example.uz"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_amount">Min summa (UZS)</Label>
                  <input
                    id="min_amount"
                    type="number"
                    className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                    value={form.min_amount}
                    onChange={(e) => update("min_amount", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_amount">Max summa (UZS)</Label>
                  <input
                    id="max_amount"
                    type="number"
                    className="w-full h-11 rounded-xl border border-black/10 bg-white/80 px-4 text-[14px] outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:bg-white/5 dark:border-white/10"
                    value={form.max_amount}
                    onChange={(e) => update("max_amount", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <h3 className="text-[15px] font-semibold mb-1">Kategoriyalar</h3>
            <p className="text-[13px] text-muted-foreground mb-4">
              Kompaniyangiz faoliyat sohalarini tanlang
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all active:scale-[0.97] ${
                    form.categories.includes(cat.value)
                      ? "bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] shadow-sm"
                      : "border border-black/10 bg-white/70 backdrop-blur hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5"
                  }`}
                  onClick={() => toggleArray("categories", cat.value)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Regions */}
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
            <h3 className="text-[15px] font-semibold mb-1">Viloyatlar</h3>
            <p className="text-[13px] text-muted-foreground mb-4">
              Faoliyat olib boradigan viloyatlaringiz
            </p>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((reg) => (
                <button
                  key={reg.value}
                  type="button"
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all active:scale-[0.97] ${
                    form.regions.includes(reg.value)
                      ? "bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] shadow-sm"
                      : "border border-black/10 bg-white/70 backdrop-blur hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5"
                  }`}
                  onClick={() => toggleArray("regions", reg.value)}
                >
                  {reg.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#1d1d1f] text-white px-8 py-3 text-[14px] font-semibold transition-all hover:bg-[#333] hover:shadow-lg active:scale-[0.97] dark:bg-white dark:text-[#1d1d1f] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              "Saqlanmoqda..."
            ) : isNew ? (
              <>
                <Plus className="h-4 w-4" />
                Profil yaratish
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Saqlash
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
