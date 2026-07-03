import { create } from "zustand";

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  increment: () => void;
  decrement: (n?: number) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: Math.max(0, n) }),
  increment: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  decrement: (n = 1) => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - n) })),
}));
