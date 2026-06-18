"use client";

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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

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
  system: <Info className="h-4 w-4 text-blue-500" />,
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
      setUnread(statsRes.data.data.unread);
    } catch {
      toast.error("Bildirishnomalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Bildirishnomalar
          </h1>
          <p className="text-muted-foreground">
            {total > 0 ? `${total} ta bildirishnoma, ${unread} ta o'qilmagan` : "Bildirishnomalar yo'q"}
          </p>
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4" />
            )}
            Hammasini o&apos;qilgan deb belgilash
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BellRing className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Hozircha bildirishnomalar yo&apos;q</p>
            <p className="text-xs text-muted-foreground mt-1">
              Yangi tenderlar va muhim yangiliklar haqida shu yerda xabar beriladi
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`transition-colors ${
                !notif.is_read ? "bg-primary/5 border-primary/20" : ""
              }`}
            >
              <CardContent className="flex items-start gap-4 py-4">
                <div className="mt-0.5 shrink-0">
                  {typeIcons[notif.type] ?? <Bell className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{notif.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {typeLabels[notif.type] ?? notif.type}
                    </Badge>
                    {!notif.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {timeAgo(notif.created_at)}
                  </p>
                </div>
                {!notif.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkRead(notif.id)}
                    className="shrink-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(hasNext || page > 1) && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => loadNotifications(page - 1)}
          >
            Oldingi
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => loadNotifications(page + 1)}
          >
            Keyingi
          </Button>
        </div>
      )}
    </div>
  );
}
