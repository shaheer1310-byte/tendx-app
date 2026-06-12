import { cn } from "@/lib/utils";

/**
 * KPI card (Build Spec section 6.1). The `accent` variant uses the navy
 * gradient background with mint trend text (the Avg Match Score card).
 */
export function KpiCard({
  label,
  value,
  trend,
  accent = false,
}: {
  label: string;
  value: string;
  trend?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-card border p-5 shadow-card",
        accent
          ? "border-transparent bg-navy-hero text-white"
          : "border-line bg-white",
      )}
    >
      <p
        className={cn(
          "label-caps",
          accent ? "text-white/70" : "text-slate",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display text-[34px] font-extrabold leading-none",
          accent ? "text-white" : "text-ink",
        )}
      >
        {value}
      </p>
      {trend && (
        <p
          className={cn(
            "mt-2 text-xs font-medium",
            accent ? "text-mint" : "text-green",
          )}
        >
          {trend}
        </p>
      )}
    </div>
  );
}
