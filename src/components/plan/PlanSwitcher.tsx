"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Plan } from "@/server/types";

const OPTIONS: { plan: Plan; label: string; price: string }[] = [
  { plan: "free", label: "Free", price: "PKR 0" },
  { plan: "professional", label: "Professional", price: "PKR 10,000 / mo" },
  { plan: "enterprise", label: "Enterprise", price: "PKR 25,000+ / mo" },
];

/**
 * Demo plan switcher. Flips the server-side plan gate via a cookie so Free vs
 * Professional gating can be exercised without billing (real billing: Phase 4).
 */
export function PlanSwitcher({ current }: { current: Plan }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Plan | null>(null);

  async function choose(plan: Plan) {
    if (plan === current) return;
    setBusy(plan);
    await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {OPTIONS.map((o) => {
        const active = o.plan === current;
        return (
          <button
            key={o.plan}
            type="button"
            onClick={() => choose(o.plan)}
            aria-pressed={active}
            className={cn(
              "rounded-card border p-4 text-left transition",
              active
                ? "border-teal bg-teal/10 ring-1 ring-teal"
                : "border-line bg-white hover:bg-cloud",
            )}
          >
            <p className="font-display text-sm font-bold text-ink">{o.label}</p>
            <p className="mt-1 text-xs text-slate">{o.price}</p>
            <p className="mt-3 text-xs font-semibold text-teal2">
              {active ? "Current plan" : busy === o.plan ? "Switching..." : "Switch"}
            </p>
          </button>
        );
      })}
    </div>
  );
}
