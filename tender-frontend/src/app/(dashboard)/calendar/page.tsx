"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  MapPin,
  Building2,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { CATEGORIES, REGIONS } from "@/types";

interface CalendarTender {
  id: number;
  title: string;
  category: string | null;
  region: string | null;
  status: string;
  amount: number | null;
  organization: string | null;
  deadline: string;
}

interface CalendarDay {
  date: string;
  tenders: CalendarTender[];
  count: number;
}

const WEEKDAYS = ["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"];
const MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500",
  closed: "bg-gray-400",
  cancelled: "bg-red-400",
  awarded: "bg-blue-500",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [status, setStatus] = useState("");

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { year, month };
      if (category) params.category = category;
      if (region) params.region = region;
      if (status) params.status = status;
      const { data: res } = await api.get("/v1/tenders/calendar/", { params });
      setData(res.data);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [year, month, category, region, status]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const tendersByDate = useMemo(() => {
    const map: Record<string, CalendarTender[]> = {};
    for (const day of data) {
      map[day.date] = day.tenders;
    }
    return map;
  }, [data]);

  const selectedTenders = selectedDate ? tendersByDate[selectedDate] ?? [] : [];

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const totalCells = firstDay + daysInMonth;
  const rows = Math.ceil(totalCells / 7);

  const goMonth = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setMonth(m);
    setYear(y);
    setSelectedDate(null);
  };

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          Tender Kalendar
        </h1>
        <p className="text-muted-foreground">
          Tenderlarni muddat bo&apos;yicha kalendarda ko&apos;ring
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListFilter className="h-4 w-4" />
            Filtrlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select
              value={category}
              onValueChange={(v) => setCategory(!v || v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kategoriya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={region}
              onValueChange={(v) => setRegion(!v || v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Viloyat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                {REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(v) => setStatus(!v || v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="active">Faol</SelectItem>
                <SelectItem value="closed">Yopilgan</SelectItem>
                <SelectItem value="cancelled">Bekor qilingan</SelectItem>
                <SelectItem value="awarded">G&apos;olib aniqlangan</SelectItem>
              </SelectContent>
            </Select>

            {(category || region || status) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCategory("");
                  setRegion("");
                  setStatus("");
                }}
              >
                Tozalash
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Calendar grid */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={() => goMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg">
                {MONTHS[month - 1]} {year}
              </CardTitle>
              <Button variant="outline" size="icon" onClick={() => goMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {/* Weekday headers */}
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}

                {/* Day cells */}
                {Array.from({ length: rows * 7 }, (_, i) => {
                  const dayNum = i - firstDay + 1;
                  const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                  const dateStr = isValid
                    ? `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
                    : "";
                  const dayTenders = isValid ? tendersByDate[dateStr] : undefined;
                  const count = dayTenders?.length ?? 0;
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;

                  return (
                    <button
                      key={i}
                      disabled={!isValid}
                      onClick={() => isValid && setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                      className={`relative bg-background p-1.5 min-h-[72px] text-left transition-colors
                        ${!isValid ? "bg-muted/30" : "hover:bg-muted/50 cursor-pointer"}
                        ${isSelected ? "ring-2 ring-primary ring-inset" : ""}
                      `}
                    >
                      {isValid && (
                        <>
                          <span
                            className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full
                              ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}
                            `}
                          >
                            {dayNum}
                          </span>
                          {count > 0 && (
                            <div className="mt-0.5 space-y-0.5">
                              {dayTenders!.slice(0, 3).map((t) => (
                                <div
                                  key={t.id}
                                  className="flex items-center gap-1"
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLORS[t.status] ?? "bg-gray-400"}`}
                                  />
                                  <span className="text-[10px] leading-tight truncate text-muted-foreground">
                                    {t.title.slice(0, 20)}
                                  </span>
                                </div>
                              ))}
                              {count > 3 && (
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  +{count - 3} ta
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected day detail */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {selectedDate
                  ? new Date(selectedDate + "T00:00:00").toLocaleDateString("uz-UZ", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Kunni tanlang"}
              </CardTitle>
              <CardDescription>
                {selectedDate
                  ? `${selectedTenders.length} ta tender`
                  : "Kalendardagi kunni bosing"}
              </CardDescription>
            </CardHeader>
          </Card>

          {selectedTenders.length > 0 && (
            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {selectedTenders.map((t) => (
                <Link key={t.id} href={`/tenders/${t.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug line-clamp-2">
                          {t.title}
                        </p>
                        <Badge
                          variant={t.status === "active" ? "default" : "secondary"}
                          className="shrink-0 text-[10px]"
                        >
                          {t.status}
                        </Badge>
                      </div>
                      {t.organization && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate">{t.organization}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        {t.region && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {t.region}
                          </span>
                        )}
                        {t.amount ? (
                          <span className="font-semibold text-green-600">
                            {t.amount.toLocaleString("uz-UZ")} UZS
                          </span>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {selectedDate && selectedTenders.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Bu kunda tender topilmadi
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
