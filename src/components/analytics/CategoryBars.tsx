import { formatPkr } from "@/lib/utils";
import type { CategoryValue } from "@/server/types";

/** Top categories by tender value won/pursued (Phase 4 analytics). */
export function CategoryBars({ data }: { data: CategoryValue[] }) {
  const max = Math.max(1, ...data.map((d) => d.valuePkr));
  return (
    <ul className="space-y-3">
      {data.map((d) => {
        const pct = (d.valuePkr / max) * 100;
        return (
          <li key={d.category} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink">{d.category}</span>
              <span className="font-semibold text-slate">{formatPkr(d.valuePkr)}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-cloud">
              <div
                className="h-full rounded-full bg-teal"
                style={{ width: `${pct}%` }}
                role="img"
                aria-label={`${d.category}: ${formatPkr(d.valuePkr)}`}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
