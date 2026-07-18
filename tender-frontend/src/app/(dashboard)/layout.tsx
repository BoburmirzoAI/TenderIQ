"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { TopNavbar } from "@/components/layout/top-navbar";
import { useAuthStore } from "@/store/auth";
import { useNotificationWS } from "@/hooks/use-notification-ws";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, initialized, init, loadUser, user } = useAuthStore();
  const { setTheme } = useTheme();
  const [ready, setReady] = useState(false);
  const [initialThemeApplied, setInitialThemeApplied] = useState(false);
  useNotificationWS();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!initialized) return;
    const token = localStorage.getItem("access_token");
    if (!isAuthenticated || !token) {
      router.push("/login");
      return;
    }
    loadUser().finally(() => setReady(true));
  }, [initialized, isAuthenticated, router, loadUser]);

  useEffect(() => {
    if (user?.theme && !initialThemeApplied) {
      setTheme(user.theme);
      setInitialThemeApplied(true);
    }
  }, [user?.theme, setTheme, initialThemeApplied]);

  if (!ready) return null;

  return (
    <>
      <TopNavbar />
      <main className="min-h-[calc(100vh-64px)] bg-[#f5f5f7] dark:bg-[#020617]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </>
  );
}
