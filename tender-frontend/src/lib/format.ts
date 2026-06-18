import { format, formatDistanceToNow, parseISO } from "date-fns";
import { uz } from "date-fns/locale";
import { CATEGORIES, REGIONS, TENDER_STATUSES } from "@/types";

export function formatAmount(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("uz-UZ").format(amount) + " UZS";
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return format(parseISO(date), "dd.MM.yyyy");
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "—";
  return format(parseISO(date), "dd.MM.yyyy HH:mm");
}

export function formatRelative(date: string | null | undefined): string {
  if (!date) return "—";
  return formatDistanceToNow(parseISO(date), { addSuffix: true, locale: uz });
}

export function getCategoryLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function getRegionLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return REGIONS.find((r) => r.value === value)?.label ?? value;
}

export function getStatusLabel(value: string): string {
  return TENDER_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function getStatusColor(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default";
    case "closed":
      return "secondary";
    case "cancelled":
      return "destructive";
    case "awarded":
      return "outline";
    default:
      return "secondary";
  }
}
