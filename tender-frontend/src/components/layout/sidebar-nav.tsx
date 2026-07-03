"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileSearch,
  BarChart3,
  Building2,
  CreditCard,
  Settings,
  LogOut,
  Target,
  FileText,
  Bell,
  Brain,
  Wallet,
  Kanban,
  FileDown,
  CalendarDays,
  Columns3,
  Calculator,
  Users,
  TrendingDown,
  UsersRound,
  Map,
  BookOpen,
  Sparkles,
  Star,
  Newspaper,
  HelpCircle,
  Headphones,
  GraduationCap,
  FileSignature,
  ClipboardList,
  MessageSquare,
  ShieldCheck,
  Phone,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth";

const navGroups = [
  {
    label: "Asosiy",
    items: [
      { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
      { href: "/tenders", label: "Tenderlar", icon: FileSearch },
      { href: "/matched", label: "Mos tenderlar", icon: Target },
      { href: "/recommendations", label: "AI tavsiyalar", icon: Sparkles },
      { href: "/pipeline", label: "Pipeline", icon: Kanban },
    ],
  },
  {
    label: "Tahlil",
    items: [
      { href: "/ml", label: "AI bashorat", icon: Brain },
      { href: "/analytics", label: "Analitika", icon: BarChart3 },
      { href: "/reports", label: "Hisobotlar", icon: FileDown },
      { href: "/competitors", label: "Raqobatchilar", icon: Users },
      { href: "/ratings", label: "Reytinglar", icon: Star },
      { href: "/pricing", label: "Narx strategiya", icon: TrendingDown },
    ],
  },
  {
    label: "Ma'lumotlar",
    items: [
      { href: "/calendar", label: "Kalendar", icon: CalendarDays },
      { href: "/compare", label: "Taqqoslash", icon: Columns3 },
      { href: "/map", label: "Xarita", icon: Map },
      { href: "/purchase-plans", label: "Xarid-reja", icon: ClipboardList },
      { href: "/contracts", label: "Shartnomalar", icon: FileSignature },
      { href: "/documents", label: "Hujjatlar", icon: FileText },
    ],
  },
  {
    label: "Jamoa",
    items: [
      { href: "/company", label: "Kompaniya", icon: Building2 },
      { href: "/teams", label: "Jamoa", icon: UsersRound },
      { href: "/journal", label: "Win/Loss", icon: BookOpen },
      { href: "/budget", label: "Kalkulyator", icon: Calculator },
    ],
  },
  {
    label: "Yordam",
    items: [
      { href: "/news", label: "Yangiliklar", icon: Newspaper },
      { href: "/knowledge-base", label: "Bilimlar bazasi", icon: GraduationCap },
      { href: "/faq", label: "FAQ", icon: HelpCircle },
      { href: "/support", label: "Texnik yordam", icon: Headphones },
      { href: "/guide", label: "Qo'llanma", icon: ShieldCheck },
      { href: "/contact", label: "Aloqa", icon: Phone },
    ],
  },
  {
    label: "Hisob",
    items: [
      { href: "/notifications", label: "Bildirishnomalar", icon: Bell },
      { href: "/payments", label: "To'lovlar", icon: Wallet },
      { href: "/subscription", label: "Obuna", icon: CreditCard },
      { href: "/settings", label: "Sozlamalar", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
            TQ
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">TenderIQ</span>
            <p className="text-[11px] text-sidebar-foreground/60 leading-none mt-0.5">Tender Intelligence</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-1">
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              {group.label}
            </p>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip="Chiqish">
              <LogOut className="h-4 w-4" />
              <span>Chiqish</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
