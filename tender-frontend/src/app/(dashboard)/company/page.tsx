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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { formatAmount } from "@/lib/format";
import { CATEGORIES, REGIONS } from "@/types";
import type { Company } from "@/types";

interface CompanyStats {
  total_matched: number;
  total_saved: number;
  avg_match_score: number;
  active_tenders: number;
}

export default function CompanyPage() {
  const [company, setCompany] = useState<Company | null>(null);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kompaniya profili</h1>
        <p className="text-muted-foreground">
          {isNew
            ? "Kompaniya profilingizni yarating"
            : "Kompaniya ma'lumotlaringizni boshqaring"}
        </p>
      </div>

      {!isNew && stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mos tenderlar</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_matched}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Saqlangan</CardTitle>
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_saved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">O&apos;rtacha moslik</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avg_match_score?.toFixed(0) ?? 0}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Faol tenderlar</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_tenders}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Asosiy ma&apos;lumotlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Kompaniya nomi *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stir">STIR (soliq raqami)</Label>
                <Input
                  id="stir"
                  value={form.stir}
                  onChange={(e) => update("stir", e.target.value)}
                  maxLength={9}
                  placeholder="123456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Tavsif</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">
                  Kalit so&apos;zlar (vergul bilan ajratilgan)
                </Label>
                <Input
                  id="keywords"
                  value={form.keywords}
                  onChange={(e) => update("keywords", e.target.value)}
                  placeholder="qurilish, ta'mirlash, loyiha"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aloqa ma&apos;lumotlari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person">Mas&apos;ul shaxs</Label>
                <Input
                  id="contact_person"
                  value={form.contact_person}
                  onChange={(e) => update("contact_person", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefon</Label>
                <Input
                  id="contact_phone"
                  value={form.contact_phone}
                  onChange={(e) => update("contact_phone", e.target.value)}
                  placeholder="+998 90 123 45 67"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Manzil</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Veb-sayt</Label>
                <Input
                  id="website"
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                  placeholder="https://example.uz"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_amount">Min summa (UZS)</Label>
                  <Input
                    id="min_amount"
                    type="number"
                    value={form.min_amount}
                    onChange={(e) => update("min_amount", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_amount">Max summa (UZS)</Label>
                  <Input
                    id="max_amount"
                    type="number"
                    value={form.max_amount}
                    onChange={(e) => update("max_amount", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kategoriyalar</CardTitle>
              <CardDescription>
                Kompaniyangiz faoliyat sohalarini tanlang
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Badge
                    key={cat.value}
                    variant={
                      form.categories.includes(cat.value)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleArray("categories", cat.value)}
                  >
                    {cat.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Viloyatlar</CardTitle>
              <CardDescription>
                Faoliyat olib boradigan viloyatlaringiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((reg) => (
                  <Badge
                    key={reg.value}
                    variant={
                      form.regions.includes(reg.value)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleArray("regions", reg.value)}
                  >
                    {reg.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving} size="lg">
            {saving ? (
              "Saqlanmoqda..."
            ) : isNew ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Profil yaratish
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Saqlash
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
