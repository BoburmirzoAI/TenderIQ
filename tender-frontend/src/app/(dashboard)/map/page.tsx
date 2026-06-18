"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Loader2,
  ArrowLeft,
  Building2,
  Tag,
} from "lucide-react";
import api from "@/lib/api";
import { CATEGORIES } from "@/types";

interface RegionStat {
  region: string;
  total: number;
  active: number;
  avg_amount: number;
  total_amount: number;
  min_amount: number;
  max_amount: number;
}

interface RegionTender {
  id: number;
  title: string;
  organization: string | null;
  category: string | null;
  status: string;
  amount: number | null;
  currency: string;
  deadline: string | null;
}

const REGION_NAMES: Record<string, string> = {
  tashkent_city: "Toshkent shahri",
  tashkent_region: "Toshkent viloyati",
  andijan: "Andijon",
  bukhara: "Buxoro",
  fergana: "Farg'ona",
  jizzakh: "Jizzax",
  kashkadarya: "Qashqadaryo",
  khorezm: "Xorazm",
  namangan: "Namangan",
  navoi: "Navoiy",
  samarkand: "Samarqand",
  sirdarya: "Sirdaryo",
  surkhandarya: "Surxondaryo",
  karakalpakstan: "Qoraqalpog'iston",
};

const REGION_COORDS: Record<string, [number, number]> = {
  tashkent_city: [41.2995, 69.2401],
  tashkent_region: [41.3167, 69.6500],
  andijan: [40.7829, 72.3442],
  bukhara: [39.7675, 64.4231],
  fergana: [40.3842, 71.7890],
  jizzakh: [40.1158, 67.8422],
  kashkadarya: [38.8600, 65.8000],
  khorezm: [41.5500, 60.6333],
  namangan: [41.0000, 71.6700],
  navoi: [40.1000, 65.3792],
  samarkand: [39.6542, 66.9597],
  sirdarya: [40.5000, 68.6500],
  surkhandarya: [38.2000, 67.8000],
  karakalpakstan: [42.4600, 59.6000],
};

function formatAmount(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} mlrd`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} mln`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} ming`;
  return amount.toFixed(0);
}

function getHeatColor(value: number, max: number): string {
  if (max === 0) return "#3b82f6";
  const ratio = Math.min(value / max, 1);
  if (ratio < 0.25) return "#3b82f6";
  if (ratio < 0.5) return "#f59e0b";
  if (ratio < 0.75) return "#f97316";
  return "#ef4444";
}

const MapContent = dynamic(
  () => import("./map-content"),
  { ssr: false, loading: () => <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> }
);

export default function MapPage() {
  const [regions, setRegions] = useState<RegionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionTenders, setRegionTenders] = useState<RegionTender[]>([]);
  const [tenderLoading, setTenderLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const loadRegions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;
      const res = await api.get("/v1/map/regions", { params });
      setRegions(res.data.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    loadRegions();
  }, [loadRegions]);

  const openRegion = async (region: string) => {
    setSelectedRegion(region);
    setTenderLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;
      const res = await api.get(`/v1/map/regions/${region}/tenders`, { params });
      setRegionTenders(res.data.data || []);
    } catch {
      setRegionTenders([]);
    } finally {
      setTenderLoading(false);
    }
  };

  const regionMap = useMemo(() => new Map(regions.map((r) => [r.region, r])), [regions]);
  const maxTotal = useMemo(() => Math.max(...regions.map((r) => r.total), 1), [regions]);

  const mapMarkers = useMemo(() => {
    return Object.entries(REGION_COORDS).map(([key, coords]) => {
      const stat = regionMap.get(key);
      const count = stat?.total || 0;
      return {
        key,
        coords,
        count,
        name: REGION_NAMES[key] || key,
        color: getHeatColor(count, maxTotal),
        radius: Math.max(12, Math.min(35, 12 + (count / maxTotal) * 23)),
        stat,
      };
    });
  }, [regionMap, maxTotal]);

  if (selectedRegion) {
    const stat = regionMap.get(selectedRegion);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedRegion(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Xaritaga qaytish
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {REGION_NAMES[selectedRegion] || selectedRegion}
            </h1>
            {stat && (
              <p className="text-sm text-muted-foreground">
                {stat.total} ta tender, {stat.active} ta faol
              </p>
            )}
          </div>
        </div>

        {stat && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-muted-foreground">Jami</p>
                <p className="text-2xl font-bold">{stat.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-muted-foreground">Faol</p>
                <p className="text-2xl font-bold text-green-600">{stat.active}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-muted-foreground">O&apos;rtacha summa</p>
                <p className="text-2xl font-bold">{formatAmount(stat.avg_amount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-muted-foreground">Umumiy summa</p>
                <p className="text-2xl font-bold">{formatAmount(stat.total_amount)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {tenderLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : regionTenders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Bu hududda tender topilmadi
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {regionTenders.map((t) => (
              <Card key={t.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{t.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {t.organization && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {t.organization}
                          </span>
                        )}
                        {t.category && (
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" /> {t.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      {t.amount && (
                        <p className="font-medium text-sm">
                          {formatAmount(t.amount)} {t.currency}
                        </p>
                      )}
                      <Badge
                        variant={t.status === "active" ? "default" : "secondary"}
                        className="text-xs mt-1"
                      >
                        {t.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tender xaritasi</h1>
        <p className="text-muted-foreground">
          O&apos;zbekiston hududlari bo&apos;yicha tenderlar
        </p>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="active">Faol</SelectItem>
            <SelectItem value="closed">Yopilgan</SelectItem>
            <SelectItem value="awarded">Yakunlangan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Kategoriya" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {Object.entries(CATEGORIES || {}).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label as string}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="pt-4 p-0 overflow-hidden rounded-lg">
              <MapContent markers={mapMarkers} onRegionClick={openRegion} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Hududlar reytingi</CardTitle>
                <CardDescription>Tender soni bo&apos;yicha</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {regions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Ma&apos;lumot topilmadi
                  </p>
                ) : (
                  regions.slice(0, 14).map((r, i) => (
                    <div
                      key={r.region}
                      className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5 -mx-2"
                      onClick={() => openRegion(r.region)}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground w-4 text-right">{i + 1}.</span>
                        <span className="truncate">{REGION_NAMES[r.region] || r.region}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{r.total}</Badge>
                        <Badge className="text-xs bg-green-100 text-green-700">{r.active}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
