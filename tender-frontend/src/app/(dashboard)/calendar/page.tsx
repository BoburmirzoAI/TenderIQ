"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  awarded: "bg-sky-400",
};

const STATUS_PILL_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 dark:text-green-400",
  closed: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
  awarded: "bg-sky-400/10 text-sky-500 dark:text-sky-400",
};

const STATUS_DOT_COLORS: Record<string, string> = {
  active: "bg-green-500",
  closed: "bg-gray-500",
  cancelled: "bg-red-500",
  awarded: "bg-sky-400",
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
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em] flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          Tender Kalendar
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Tenderlarni muddat bo&apos;yicha kalendarda ko&apos;ring
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
        <h3 className="text-[15px] font-semibold flex items-center gap-2 mb-4">
          <ListFilter className="h-4 w-4" />
          Filtrlar
        </h3>
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
            <button
              className="rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5"
              onClick={() => {
                setCategory("");
                setRegion("");
                setStatus("");
              }}
            >
              Tozalash
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Calendar grid */}
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <button
              className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-2.5 transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5"
              onClick={() => goMonth(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-bold tracking-tight">
              {MONTHS[month - 1]} {year}
            </h3>
            <button
              className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-2.5 transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5"
              onClick={() => goMonth(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
              {/* Weekday headers */}
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="bg-white/40 dark:bg-white/[0.02] px-2 py-2 text-center text-[12px] font-semibold text-muted-foreground uppercase tracking-wider"
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
                    className={`relative bg-white/80 dark:bg-[rgba(17,24,39,0.3)] p-1.5 min-h-[72px] text-left transition-all
                      ${!isValid ? "bg-white/30 dark:bg-[rgba(17,24,39,0.15)]" : "hover:bg-white dark:hover:bg-[rgba(17,24,39,0.6)] cursor-pointer"}
                      ${isSelected ? "ring-2 ring-sky-400 ring-inset bg-sky-50/50 dark:bg-sky-400/10" : ""}
                    `}
                  >
                    {isValid && (
                      <>
                        <span
                          className={`text-[12px] font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full
                            ${isToday ? "bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f]" : "text-foreground"}
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
        </div>

        {/* Selected day detail */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all">
            <h3 className="text-[15px] font-semibold">
              {selectedDate
                ? new Date(selectedDate + "T00:00:00").toLocaleDateString("uz-UZ", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Kunni tanlang"}
            </h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {selectedDate
                ? `${selectedTenders.length} ta tender`
                : "Kalendardagi kunni bosing"}
            </p>
          </div>

          {selectedTenders.length > 0 && (
            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {selectedTenders.map((t) => (
                <Link key={t.id} href={`/tenders/${t.id}`}>
                  <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-4 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg hover:scale-[1.01] cursor-pointer space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold leading-snug line-clamp-2">
                        {t.title}
                      </p>
                      <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${STATUS_PILL_COLORS[t.status] || STATUS_PILL_COLORS.closed}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_COLORS[t.status] || STATUS_DOT_COLORS.closed}`} />
                        {t.status}
                      </span>
                    </div>
                    {t.organization && (
                      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">{t.organization}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[12px]">
                      {t.region && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {t.region}
                        </span>
                      )}
                      {t.amount ? (
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {t.amount.toLocaleString("uz-UZ")} UZS
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {selectedDate && selectedTenders.length === 0 && (
            <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 text-center text-[13px] text-muted-foreground dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
              Bu kunda tender topilmadi
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
