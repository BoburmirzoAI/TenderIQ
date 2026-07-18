"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  Trophy,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { useNotificationStore } from "@/store/notifications";

interface Notification {
  id: number;
  type: string;
  channel: string;
  title: string;
  message: string;
  is_read: boolean;
  tender_id: number | null;
  created_at: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  match: <Trophy className="h-4 w-4 text-primary" />,
  deadline: <Clock className="h-4 w-4 text-amber-500" />,
  result: <CheckCheck className="h-4 w-4 text-green-500" />,
  system: <Info className="h-4 w-4 text-sky-400" />,
  alert: <AlertTriangle className="h-4 w-4 text-red-500" />,
};

const typeLabels: Record<string, string> = {
  match: "Mos tender",
  deadline: "Muddat",
  result: "Natija",
  system: "Tizim",
  alert: "Ogohlantirish",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "Hozirgina";
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`;
  return date.toLocaleDateString("uz-UZ");
}

export default function NotificationsPage() {
  const { setUnreadCount, decrement: decrementGlobal } = useNotificationStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async (p: number) => {
    try {
      const [listRes, statsRes] = await Promise.all([
        api.get(`/v1/notifications?page=${p}&per_page=20`),
        api.get("/v1/notifications/stats"),
      ]);
      setNotifications(listRes.data.data);
      setTotal(listRes.data.total);
      setHasNext(listRes.data.has_next);
      setPage(p);
      const unreadVal = statsRes.data.data.unread ?? 0;
      setUnread(unreadVal);
      setUnreadCount(unreadVal);
    } catch {
      toast.error("Bildirishnomalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    loadNotifications(1);
  }, [loadNotifications]);

  const handleMarkRead = async (id: number) => {
    try {
      await api.patch(`/v1/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnread((prev) => Math.max(0, prev - 1));
      decrementGlobal(1);
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch("/v1/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
      setUnreadCount(0);
      toast.success("Barcha bildirishnomalar o'qilgan deb belgilandi");
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-0.03em] flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Bildirishnomalar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total > 0 ? `${total} ta bildirishnoma, ${unread} ta o'qilmagan` : "Bildirishnomalar yo'q"}
          </p>
        </div>
        {unread > 0 && (
          <button
            className="rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4 inline" />
            )}
            Hammasini o&apos;qilgan deb belgilash
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-6 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg">
          <div className="flex flex-col items-center justify-center py-12">
            <BellRing className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Hozircha bildirishnomalar yo&apos;q</p>
            <p className="text-xs text-muted-foreground mt-1">
              Yangi tenderlar va muhim yangiliklar haqida shu yerda xabar beriladi
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-2xl border border-white/50 bg-white/60 backdrop-blur-xl p-5 dark:bg-[rgba(17,24,39,0.5)] dark:border-white/[0.08] transition-all hover:shadow-lg hover:bg-white/80 dark:hover:bg-[rgba(17,24,39,0.7)] ${
                !notif.is_read ? "bg-sky-50/60 border-sky-200/50 dark:bg-sky-400/[0.06] dark:border-sky-400/[0.15]" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.03] dark:bg-white/[0.05]">
                  {typeIcons[notif.type] ?? <Bell className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[15px]">{notif.title}</span>
                    <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 text-[12px] font-semibold">
                      {typeLabels[notif.type] ?? notif.type}
                    </span>
                    {!notif.is_read && (
                      <div className="h-2 w-2 rounded-full bg-sky-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[14px] text-muted-foreground">{notif.message}</p>
                  <p className="text-[12px] text-muted-foreground mt-1.5">
                    {timeAgo(notif.created_at)}
                  </p>
                </div>
                {!notif.is_read && (
                  <button
                    className="rounded-xl border border-black/10 bg-white/70 backdrop-blur px-3 py-2 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5 shrink-0"
                    onClick={() => handleMarkRead(notif.id)}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(hasNext || page > 1) && (
        <div className="flex justify-center gap-2">
          <button
            className="rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5"
            disabled={page <= 1}
            onClick={() => loadNotifications(page - 1)}
          >
            Oldingi
          </button>
          <button
            className="rounded-xl border border-black/10 bg-white/70 backdrop-blur px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/5"
            disabled={!hasNext}
            onClick={() => loadNotifications(page + 1)}
          >
            Keyingi
          </button>
        </div>
      )}
    </div>
  );
}
