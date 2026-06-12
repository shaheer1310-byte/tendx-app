import type { MonthlyPoint } from "@/server/types";

/**
 * Monthly bids submitted vs won (Phase 4 analytics). Pure SVG, server-rendered,
 * matching the custom-chart approach of the dashboard PipelineDonut.
 */
export function GroupedBars({ data }: { data: MonthlyPoint[] }) {
  const W = 340;
  const H = 180;
  const padX = 28;
  const padTop = 16;
  const padBottom = 26;
  const plotH = H - padTop - padBottom;
  const max = Math.max(1, ...data.map((d) => Math.max(d.submitted, d.won)));
  const groupW = (W - padX * 2) / data.length;
  const barW = Math.min(12, groupW / 3);

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Bids submitted versus won by month">
        {/* baseline */}
        <line x1={padX} y1={padTop + plotH} x2={W - padX} y2={padTop + plotH} className="stroke-line" strokeWidth={1} />
        {data.map((d, i) => {
          const cx = padX + groupW * i + groupW / 2;
          const hSub = (d.submitted / max) * plotH;
          const hWon = (d.won / max) * plotH;
          const y = padTop + plotH;
          return (
            <g key={d.month}>
              <rect x={cx - barW - 1} y={y - hSub} width={barW} height={hSub} rx={2} className="fill-teal" />
              <rect x={cx + 1} y={y - hWon} width={barW} height={hWon} rx={2} className="fill-gold" />
              <text x={cx} y={H - 8} textAnchor="middle" className="fill-slate" fontSize={10}>
                {d.month}
              </text>
            </g>
          );
        })}
      </svg>
      <ul className="flex items-center gap-4 text-xs">
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-teal" />
          <span className="text-slate">Submitted</span>
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gold" />
          <span className="text-slate">Won</span>
        </li>
      </ul>
    </div>
  );
}
