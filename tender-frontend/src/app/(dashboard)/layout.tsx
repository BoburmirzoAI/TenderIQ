"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/layout/sidebar-nav";
import { Header } from "@/components/layout/header";
import { useAuthStore } from "@/store/auth";

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

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) {
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
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
