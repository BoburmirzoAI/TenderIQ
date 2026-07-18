"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileSearch,
  Target,
  Sparkles,
  Kanban,
  Brain,
  BarChart3,
  FileDown,
  Users,
  Star,
  TrendingDown,
  CalendarDays,
  Columns3,
  Map,
  ClipboardList,
  FileSignature,
  FileText,
  Building2,
  UsersRound,
  BookOpen,
  Calculator,
  Newspaper,
  GraduationCap,
  HelpCircle,
  Headphones,
  ShieldCheck,
  Phone,
  Bell,
  Settings,

  CreditCard,
  Search,
  Sun,
  Moon,
  Monitor,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";
import { useTheme } from "next-themes";
import api from "@/lib/api";

const navGroups = [
  {
    label: "Asosiy",
    columns: [
      {
        title: "Sahifalar",
        items: [
          { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
          { href: "/tenders", label: "Tenderlar", icon: FileSearch },
          { href: "/matched", label: "Mos tenderlar", icon: Target },
        ],
      },
      {
        title: "AI",
        items: [
          { href: "/recommendations", label: "AI tavsiyalar", icon: Sparkles },
          { href: "/pipeline", label: "Pipeline", icon: Kanban },
        ],
      },
    ],
  },
  {
    label: "Tahlil",
    columns: [
      {
        title: "Analitika",
        items: [
          { href: "/ml", label: "AI bashorat", icon: Brain },
          { href: "/analytics", label: "Analitika", icon: BarChart3 },
          { href: "/reports", label: "Hisobotlar", icon: FileDown },
        ],
      },
      {
        title: "Raqobat",
        items: [
          { href: "/competitors", label: "Raqobatchilar", icon: Users },
          { href: "/ratings", label: "Reytinglar", icon: Star },
          { href: "/pricing", label: "Narx strategiya", icon: TrendingDown },
        ],
      },
    ],
  },
  {
    label: "Ma’lumotlar",
    columns: [
      {
        title: "Ko’rish",
        items: [
          { href: "/calendar", label: "Kalendar", icon: CalendarDays },
          { href: "/compare", label: "Taqqoslash", icon: Columns3 },
          { href: "/map", label: "Xarita", icon: Map },
        ],
      },
      {
        title: "Hujjatlar",
        items: [
          { href: "/purchase-plans", label: "Xarid-reja", icon: ClipboardList },
          { href: "/documents", label: "Hujjatlar", icon: FileText },
          { href: "/contracts", label: "Shartnomalar", icon: FileSignature },
        ],
      },
    ],
  },
  {
    label: "Jamoa",
    columns: [
      {
        title: "Boshqaruv",
        items: [
          { href: "/company", label: "Kompaniya", icon: Building2 },
          { href: "/teams", label: "Jamoa", icon: UsersRound },
        ],
      },
      {
        title: "Natijalar",
        items: [
          { href: "/journal", label: "Win/Loss", icon: BookOpen },
          { href: "/budget", label: "Kalkulyator", icon: Calculator },
        ],
      },
    ],
  },
  {
    label: "Yordam",
    columns: [
      {
        title: "Yordam",
        items: [
          { href: "/news", label: "Yangiliklar", icon: Newspaper },
          { href: "/knowledge-base", label: "Bilimlar bazasi", icon: GraduationCap },
          { href: "/faq", label: "FAQ", icon: HelpCircle },
        ],
      },
      {
        title: "Qo’llab-quvvatlash",
        items: [
          { href: "/support", label: "Texnik yordam", icon: Headphones },
          { href: "/guide", label: "Qo’llanma", icon: ShieldCheck },
          { href: "/contact", label: "Aloqa", icon: Phone },
        ],
      },
    ],
  },
];

function isGroupActive(group: typeof navGroups[number], pathname: string) {
  return group.columns.some((col) =>
    col.items.some((item) => {
      const hrefPath = item.href.split("?")[0];
      return (
        pathname === hrefPath ||
        (hrefPath !== "/dashboard" && pathname.startsWith(hrefPath))
      );
    })
  );
}

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { theme, setTheme } = useTheme();

  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [avatarOpen, setAvatarOpen] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null);

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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/tenders?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      searchRef.current?.blur();
    }
  };

  const handleGroupEnter = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenGroup(label);
  };

  const handleGroupLeave = () => {
    closeTimer.current = setTimeout(() => setOpenGroup(null), 150);
  };

  const handleDropdownEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 pointer-events-none ${
          openGroup
            ? "bg-white/40 dark:bg-black/40 backdrop-blur-md opacity-100 visible"
            : "opacity-0 invisible"
        }`}
      />

      <nav
        ref={navRef}
        className="anav sticky top-0 z-50 flex h-16 items-center justify-center border-b border-black/[0.06] dark:border-white/5 px-4 lg:px-8 bg-white/85 dark:bg-slate-950/80 backdrop-blur-xl backdrop-saturate-200"
      >
        <div className="flex w-full max-w-[1400px] items-center justify-between">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 no-underline shrink-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-extrabold bg-sky-400 text-slate-950">
                TQ
              </div>
              <span className="text-lg font-extrabold tracking-tight text-foreground">
                Tender<span className="text-sky-400">IQ</span>
              </span>
            </Link>

            {/* Pill nav */}
            <div className="hidden lg:flex items-center gap-1 rounded-full border border-black/[0.08] dark:border-white/5 px-1 py-1 bg-black/[0.06] dark:bg-slate-900/60"
            >
            {navGroups.map((group) => {
              const active = isGroupActive(group, pathname);
              const isOpen = openGroup === group.label;

              return (
                <div
                  key={group.label}
                  className="relative"
                  onMouseEnter={() => handleGroupEnter(group.label)}
                  onMouseLeave={handleGroupLeave}
                >
                  <button
                    className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer border-none whitespace-nowrap ${
                      isOpen
                        ? "text-sky-400 bg-white/80 dark:bg-sky-400/10 shadow-sm"
                        : active
                        ? "text-sky-400 bg-sky-400/10"
                        : "text-muted-foreground hover:text-sky-400 dark:text-slate-400 dark:hover:text-white hover:bg-white/80 dark:hover:bg-sky-400/10"
                    }`}
                    style={{ fontFamily: "inherit" }}
                  >
                    {group.label}
                  </button>

                  {/* Invisible bridge */}
                  {isOpen && (
                    <div className="absolute top-full left-0 right-0 h-5" />
                  )}

                  {/* Dropdown */}
                  <div
                    className={`absolute top-[calc(100%+16px)] left-1/2 w-max transition-all duration-250 z-50 ${
                      isOpen
                        ? "opacity-100 visible -translate-x-1/2 translate-y-0"
                        : "opacity-0 invisible -translate-x-1/2 -translate-y-2"
                    }`}
                    style={{
                      transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                    onMouseEnter={handleDropdownEnter}
                    onMouseLeave={handleGroupLeave}
                  >
                    <div
                      className="rounded-2xl border border-black/[0.06] dark:border-white/5 overflow-hidden bg-[rgba(245,245,247,0.95)] dark:bg-slate-900/95 backdrop-blur-[80px] shadow-[0_16px_48px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.04)]"
                    >
                      <div className="flex gap-11 p-7 pb-8">
                        {group.columns.map((col) => (
                          <div key={col.title} className="min-w-[160px]">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-500 mb-4 pb-3 border-b border-black/[0.06] dark:border-white/5">
                              {col.title}
                            </h4>
                            <div className="space-y-0.5">
                              {col.items.map((item) => {
                                const hrefPath = item.href.split("?")[0];
                                const isActive =
                                  pathname === hrefPath ||
                                  (hrefPath !== "/dashboard" &&
                                    pathname.startsWith(hrefPath));
                                return (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpenGroup(null)}
                                    className={`flex items-center gap-3 text-base font-medium rounded-full px-[18px] py-2.5 -mx-[18px] transition-all duration-150 no-underline ${
                                      isActive
                                        ? "text-sky-400 bg-sky-400/[0.08]"
                                        : "text-foreground hover:text-sky-400 hover:bg-sky-400/[0.08]"
                                    }`}
                                  >
                                    <item.icon className="h-[18px] w-[18px] opacity-60" />
                                    {item.label}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Search — always visible */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Tender qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-48 xl:w-72 rounded-lg border border-black/[0.08] dark:border-white/5 bg-white/60 dark:bg-slate-900 pl-9 pr-12 text-sm outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 focus:w-72 xl:focus:w-80 dark:text-white dark:placeholder:text-slate-500"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-black/[0.1] dark:border-white/[0.15] bg-black/[0.04] dark:bg-white/[0.06] px-1.5 text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </form>

            {/* Bell */}
            <Link
              href="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-black/[0.08] dark:border-white/5 bg-white/60 dark:bg-slate-900 transition-colors hover:bg-black/[0.06] dark:hover:bg-slate-800"
            >
              <Bell className="h-4 w-4 text-muted-foreground dark:text-slate-400 hover:text-sky-400 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Avatar */}
            <div className="relative ml-1.5">
              <button
                onClick={() => setAvatarOpen(!avatarOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-slate-950 border-none cursor-pointer bg-gradient-to-br from-sky-400 to-indigo-400"
              >
                {initials}
              </button>

              {avatarOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] w-56 rounded-2xl border border-black/[0.06] dark:border-white/5 overflow-hidden bg-[rgba(245,245,247,0.95)] dark:bg-slate-900/95 backdrop-blur-[80px] shadow-[0_16px_48px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.04)]"
                >
                  <div className="px-4 py-3 border-b border-black/[0.06] dark:border-white/5">
                    <p className="text-sm font-semibold text-foreground">
                      {user?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/settings"
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors no-underline"
                    >
                      <Settings className="h-4 w-4 opacity-60" />
                      Sozlamalar
                    </Link>
                    <Link
                      href="/subscription"
                      onClick={() => setAvatarOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors no-underline"
                    >
                      <CreditCard className="h-4 w-4 opacity-60" />
                      Obuna
                    </Link>
                    <button
                      onClick={() => {
                        setTheme(nextTheme);
                        if (user) setUser({ ...user, theme: nextTheme });
                        api.patch("/v1/auth/me", { theme: nextTheme }).catch(() => {});
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors border-none bg-transparent cursor-pointer"
                      style={{ fontFamily: "inherit" }}
                    >
                      <ThemeIcon className="h-4 w-4 opacity-60" />
                      {theme === "light" ? "Qorong'i rejim" : theme === "dark" ? "Tizim rejimi" : "Yorug' rejim"}
                    </button>
                  </div>
                  <div className="border-t border-black/[0.06] dark:border-white/5 p-2">
                    <button
                      onClick={() => {
                        setAvatarOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/[0.06] transition-colors border-none bg-transparent cursor-pointer"
                      style={{ fontFamily: "inherit" }}
                    >
                      <LogOut className="h-4 w-4" />
                      Chiqish
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
