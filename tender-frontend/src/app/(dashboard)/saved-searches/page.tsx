"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Search,
  Trash2,
  Bell,
  BellOff,
  Plus,
  FileSearch,
  ArrowRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

interface SavedSearch {
  id: number;
  name: string;
  query: string | null;
  filters: Record<string, unknown> | null;
  notify: boolean;
  created_at: string;
  last_used: string | null;
  result_count: number | null;
}

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/v1/saved-searches")
      .then((r) => setSearches(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleNotify = async (id: number, current: boolean) => {
    try {
      await api.patch(`/v1/saved-searches/${id}`, { notify: !current });
      setSearches((prev) =>
        prev.map((s) => (s.id === id ? { ...s, notify: !current } : s))
      );
    } catch {}
  };

  const deleteSearch = async (id: number) => {
    try {
      await api.delete(`/v1/saved-searches/${id}`);
      setSearches((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">
            Saqlangan qidiruvlar
          </h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            Tez-tez ishlatadigan qidiruv filtrlaringiz
          </p>
        </div>
        <Link href="/tenders">
          <button className="inline-flex items-center gap-2 rounded-xl bg-[#1d1d1f] text-white px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-[#333] hover:shadow-md active:scale-[0.98] dark:bg-white dark:text-[#1d1d1f]">
            <Plus className="h-4 w-4" />
            Yangi qidiruv
          </button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : searches.length === 0 ? (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl py-16 text-center dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08]">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-black/[0.03] flex items-center justify-center mb-4 dark:bg-white/[0.05]">
            <Bookmark className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="text-[16px] font-semibold">
            Saqlangan qidiruvlar yo&apos;q
          </p>
          <p className="text-[13px] text-muted-foreground mt-1 max-w-sm mx-auto">
            Tenderlar sahifasida qidiruv qilib, natijani saqlashingiz mumkin.
            Bildirishnoma yoqilsa, yangi mos tenderlar haqida xabar olasiz.
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Link href="/tenders">
              <button className="inline-flex items-center gap-2 rounded-xl bg-sky-400/10 text-sky-500 px-5 py-2.5 text-[13px] font-semibold transition-all hover:bg-sky-400/20 active:scale-[0.97]">
                <FileSearch className="h-4 w-4" />
                Tenderlarni qidirish
              </button>
            </Link>
            <Link href="/matched">
              <button className="inline-flex items-center gap-2 rounded-xl bg-green-500/10 text-green-600 px-5 py-2.5 text-[13px] font-semibold transition-all hover:bg-green-500/20 active:scale-[0.97]">
                Mos tenderlar
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 shrink-0 mt-0.5">
                    <Search className="h-5 w-5 text-sky-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold truncate">{s.name}</p>
                    {s.query && (
                      <p className="text-[12px] text-muted-foreground mt-0.5 truncate">
                        Qidiruv: &quot;{s.query}&quot;
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString("uz")}
                      </span>
                      {s.result_count != null && (
                        <span className="text-[11px] font-medium rounded-full bg-sky-400/10 text-sky-500 px-2 py-0.5">
                          {s.result_count} natija
                        </span>
                      )}
                      {s.notify && (
                        <span className="text-[11px] font-medium rounded-full bg-green-500/10 text-green-600 px-2 py-0.5">
                          Bildirishnoma yoqilgan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleNotify(s.id, s.notify)}
                    className={`rounded-lg p-2 transition-all hover:scale-110 ${
                      s.notify
                        ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                        : "bg-black/[0.04] text-muted-foreground hover:bg-black/[0.08] dark:bg-white/[0.06]"
                    }`}
                    title={
                      s.notify
                        ? "Bildirishnomani o'chirish"
                        : "Bildirishnomani yoqish"
                    }
                  >
                    {s.notify ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </button>
                  <Link href={`/tenders${s.query ? `?q=${encodeURIComponent(s.query)}` : ""}`}>
                    <button className="rounded-lg p-2 bg-sky-400/10 text-sky-500 transition-all hover:bg-sky-400/20 hover:scale-110">
                      <FileSearch className="h-4 w-4" />
                    </button>
                  </Link>
                  <button
                    onClick={() => deleteSearch(s.id)}
                    className="rounded-lg p-2 bg-red-500/10 text-red-500 transition-all hover:bg-red-500/20 hover:scale-110"
                    title="O'chirish"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
