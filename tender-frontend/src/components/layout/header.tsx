"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Sun, Moon, Monitor } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";
import { useTheme } from "next-themes";
import Link from "next/link";
import api from "@/lib/api";

export function Header() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const themeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const ThemeIcon = themeIcon;
  const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const initials =
    user?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/tenders?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <SidebarTrigger />

      <div className="flex-1">
        <form onSubmit={handleSearch} className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tender qidirish..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      <button
        onClick={() => {
          setTheme(nextTheme);
          if (user) setUser({ ...user, theme: nextTheme });
          api.patch("/v1/auth/me", { theme: nextTheme }).catch(() => {});
        }}
        title={`Mavzu: ${theme}`}
        className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
      >
        <ThemeIcon className="h-5 w-5" />
      </button>

      <Link
        href="/notifications"
        className="relative h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger className="relative h-9 w-9 rounded-full outline-none">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-sm font-medium">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Link href="/settings" className="w-full">
              Sozlamalar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/subscription" className="w-full">
              Obuna
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive">
            Chiqish
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
