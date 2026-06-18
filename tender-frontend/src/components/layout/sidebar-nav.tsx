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

const navItems = [
  { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
  { href: "/tenders", label: "Tenderlar", icon: FileSearch },
  { href: "/matched", label: "Mos tenderlar", icon: Target },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/ml", label: "AI bashorat", icon: Brain },
  { href: "/analytics", label: "Analitika", icon: BarChart3 },
  { href: "/reports", label: "Hisobotlar", icon: FileDown },
  { href: "/calendar", label: "Kalendar", icon: CalendarDays },
  { href: "/compare", label: "Taqqoslash", icon: Columns3 },
  { href: "/budget", label: "Kalkulyator", icon: Calculator },
  { href: "/competitors", label: "Raqobatchilar", icon: Users },
  { href: "/pricing", label: "Narx strategiya", icon: TrendingDown },
  { href: "/teams", label: "Jamoa", icon: UsersRound },
  { href: "/map", label: "Tender xaritasi", icon: Map },
  { href: "/journal", label: "Win/Loss kundalik", icon: BookOpen },
  { href: "/documents", label: "Hujjatlar", icon: FileText },
  { href: "/notifications", label: "Bildirishnomalar", icon: Bell },
  { href: "/company", label: "Kompaniya", icon: Building2 },
  { href: "/payments", label: "To'lovlar", icon: Wallet },
  { href: "/subscription", label: "Obuna", icon: CreditCard },
  { href: "/settings", label: "Sozlamalar", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            TQ
          </div>
          <span className="text-lg font-bold">TenderIQ</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                render={<Link href={item.href} />}
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t px-2 py-4">
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
