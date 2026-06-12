import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, de-duplicating Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a PKR amount, e.g. 24000000 -> "PKR 24.0M". */
export function formatPkr(valuePkr: number): string {
  if (valuePkr >= 1_000_000) {
    return `PKR ${(valuePkr / 1_000_000).toFixed(1)}M`;
  }
  if (valuePkr >= 1_000) {
    return `PKR ${(valuePkr / 1_000).toFixed(0)}K`;
  }
  return `PKR ${valuePkr.toLocaleString()}`;
}

/** Exact PKR amount with thousands separators, e.g. "PKR 24,000,000". */
export function formatPkrExact(valuePkr: number): string {
  const sign = valuePkr < 0 ? "-" : "";
  return `${sign}PKR ${Math.abs(Math.round(valuePkr)).toLocaleString("en-US")}`;
}

/** Whole days from now until an ISO date (negative if already past). */
export function daysUntil(iso: string): number {
  if (!iso) return 0;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Short date, e.g. "2026-06-12" -> "12 Jun". */
export function formatShortDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
