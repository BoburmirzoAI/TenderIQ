"use client";

import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useWebSocket } from "./use-websocket";
import { useNotificationStore } from "@/store/notifications";
import api from "@/lib/api";

export function useNotificationWS() {
  const { on } = useWebSocket("/api/ws/tenders");
  const { setUnreadCount, increment } = useNotificationStore();

  // Boshlang'ich unread sonni yuklash
  const loadUnread = useCallback(async () => {
    try {
      const { data } = await api.get("/v1/notifications/stats");
      setUnreadCount(data.data.unread ?? 0);
    } catch {
      // silent
    }
  }, [setUnreadCount]);

  useEffect(() => {
    loadUnread();
  }, [loadUnread]);

  // notification eventi — user ga yuborilgan shaxsiy bildirishnoma
  useEffect(() => {
    return on("notification", (data) => {
      increment();
      const title = (data.title as string) ?? "Yangi bildirishnoma";
      const message = (data.message as string) ?? "";
      toast(title, {
        description: message || undefined,
        action: {
          label: "Ko'rish",
          onClick: () => { window.location.href = "/notifications"; },
        },
      });
    });
  }, [on, increment]);

  // new_tender eventi — yangi tender qo'shildi
  useEffect(() => {
    return on("new_tender", (data) => {
      const title = (data.title as string) ?? "Yangi tender";
      toast("Yangi tender qo'shildi", {
        description: title.length > 60 ? title.slice(0, 60) + "…" : title,
        action: {
          label: "Ko'rish",
          onClick: () => { window.location.href = "/tenders"; },
        },
      });
    });
  }, [on]);
}
