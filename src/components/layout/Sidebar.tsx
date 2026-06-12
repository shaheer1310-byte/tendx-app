"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListFilter,
  Sparkles,
  FileText,
  Store,
  Calculator,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  // Optional override for the active-state test.
  isActive?: (path: string) => boolean;
}

// Sidebar nav in spec order (Build Spec section 5).
const NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    isActive: (p) => p === "/dashboard",
  },
  {
    label: "Tender Feed",
    href: "/tenders",
    icon: ListFilter,
    // Feed, import and tender detail, but not the per-tender analyzer.
    isActive: (p) => p.startsWith("/tenders") && !p.endsWith("/analyze"),
  },
  {
    label: "AI Analyzer",
    href: "/analyze",
    icon: Sparkles,
    isActive: (p) => p === "/analyze" || p.endsWith("/analyze"),
  },
  { label: "Bid Generator", href: "/bids", icon: FileText },
  { label: "Supplier Hub", href: "/suppliers", icon: Store },
  { label: "Tax and Profit", href: "/tax", icon: Calculator },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-navy text-white">
      <div className="px-5 py-6">
        <Link href="/dashboard" aria-label="TendX home">
          <Logo size={34} onDark />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Primary">
        {NAV.map((item) => {
          const active = item.isActive
            ? item.isActive(pathname)
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-teal-accent text-white shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Plan-upgrade card, shown to Free users (Build Spec section 5) */}
      <div className="m-3 rounded-card bg-white/5 p-4 ring-1 ring-white/10">
        <p className="font-display text-sm font-bold text-white">
          Professional Plan
        </p>
        <p className="mt-1 text-xs leading-relaxed text-white/65">
          Unlock AI matching, bid generation and profit analytics.
        </p>
        <Link
          href="/settings"
          className="mt-3 flex w-full items-center justify-center rounded-lg bg-gold-accent px-3 py-2 text-sm font-semibold text-navy transition hover:opacity-90"
        >
          Upgrade
        </Link>
      </div>
    </aside>
  );
}
