import { cn } from "@/lib/utils";

interface Segment {
  label: string;
  value: number; // percent
  strokeClass: string;
  dotClass: string;
}

/**
 * Bid Pipeline donut (Build Spec section 6.1): win-readiness with a legend.
 * Bid-ready and compliant (teal), Missing documents (gold), Under review (line).
 */
export function PipelineDonut({
  pipeline,
}: {
  pipeline: { bidReady: number; missingDocs: number; underReview: number };
}) {
  const segments: Segment[] = [
    {
      label: "Bid-ready and compliant",
      value: pipeline.bidReady,
      strokeClass: "stroke-teal",
      dotClass: "bg-teal",
    },
    {
      label: "Missing documents",
      value: pipeline.missingDocs,
      strokeClass: "stroke-gold",
      dotClass: "bg-gold",
    },
    {
      label: "Under review",
      value: pipeline.underReview,
      strokeClass: "stroke-line",
      dotClass: "bg-line",
    },
  ];

  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            className="stroke-cloud"
            strokeWidth="14"
          />
          {segments.map((s) => {
            const len = (s.value / 100) * c;
            const dash = `${len} ${c - len}`;
            const el = (
              <circle
                key={s.label}
                cx="60"
                cy="60"
                r={r}
                fill="none"
                className={s.strokeClass}
                strokeWidth="14"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-extrabold text-ink">
            {pipeline.bidReady}%
          </span>
          <span className="text-xs text-slate">Win-ready</span>
        </div>
      </div>

      <ul className="w-full space-y-2">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span className={cn("h-2.5 w-2.5 rounded-full", s.dotClass)} />
            <span className="text-slate">{s.label}</span>
            <span className="ml-auto font-display font-semibold text-ink">
              {s.value}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
