import { Check, X, AlertTriangle } from "lucide-react";
import type { EligibilityCriterion } from "@/lib/ai";
import { cn } from "@/lib/utils";

const STATUS = {
  pass: { icon: Check, wrap: "bg-green/12 text-green" },
  fail: { icon: X, wrap: "bg-red/12 text-red" },
  warning: { icon: AlertTriangle, wrap: "bg-gold/20 text-ink" },
} as const;

/** Eligibility checklist (Build Spec sections 6.3, Panel 1). */
export function EligibilityList({
  items,
}: {
  items: EligibilityCriterion[];
}) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => {
        const conf = STATUS[item.status];
        const Icon = conf.icon;
        return (
          <li key={i} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full",
                conf.wrap,
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{item.criterion}</p>
              <p className="text-xs text-slate">{item.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
