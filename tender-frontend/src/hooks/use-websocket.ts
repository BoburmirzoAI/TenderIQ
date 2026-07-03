"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type WSEvent = {
  type: string;
  data: Record<string, unknown>;
};

type WSStatus = "connecting" | "connected" | "disconnected";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000, 30000];

export function useWebSocket(path: string = "/api/ws/tenders") {
  const [status, setStatus] = useState<WSStatus>("disconnected");
  const [lastEvent, setLastEvent] = useState<WSEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenersRef = useRef<Map<string, Set<(data: Record<string, unknown>) => void>>>(new Map());
  const mountedRef = useRef(true);

  const on = useCallback((eventType: string, handler: (data: Record<string, unknown>) => void) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType)!.add(handler);
    return () => {
      listenersRef.current.get(eventType)?.delete(handler);
    };
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const url = `${WS_BASE}${path}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      setStatus("connecting");

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setStatus("connected");
        retriesRef.current = 0;

        if (token) {
          ws.send(JSON.stringify({ type: "auth", token }));
        }

        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const parsed: WSEvent = JSON.parse(event.data);
          if (parsed.type === "pong") return;

          setLastEvent(parsed);

          const handlers = listenersRef.current.get(parsed.type);
          if (handlers) {
            handlers.forEach((h) => h(parsed.data));
          }
          const allHandlers = listenersRef.current.get("*");
          if (allHandlers) {
            allHandlers.forEach((h) => h(parsed as unknown as Record<string, unknown>));
          }
        } catch {
          // ignore non-JSON messages
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setStatus("disconnected");
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        const delay = RECONNECT_DELAYS[Math.min(retriesRef.current, RECONNECT_DELAYS.length - 1)];
        retriesRef.current++;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      const delay = RECONNECT_DELAYS[Math.min(retriesRef.current, RECONNECT_DELAYS.length - 1)];
      retriesRef.current++;
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    }
  }, [path]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { status, lastEvent, on };
}
