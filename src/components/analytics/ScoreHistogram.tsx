import type { ScoreBucket } from "@/server/types";

/** Match-score distribution across the company's matched tenders (Phase 4). */
export function ScoreHistogram({ data }: { data: ScoreBucket[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-44 items-end gap-3">
      {data.map((d) => {
        const pct = (d.count / max) * 100;
        return (
          <div key={d.range} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-xs font-semibold text-ink">{d.count}</span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-navy-hero"
                style={{ height: `${pct}%` }}
                role="img"
                aria-label={`${d.count} matches scored ${d.range}`}
              />
            </div>
            <span className="text-[11px] text-slate">{d.range}</span>
          </div>
        );
      })}
    </div>
  );
}
