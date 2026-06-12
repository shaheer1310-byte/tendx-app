import Link from "next/link";
import { FileText } from "lucide-react";
import { IconChip } from "@/components/ui/IconChip";
import { MatchScoreChip } from "@/components/ui/MatchScoreChip";
import { daysUntil, formatPkr, formatShortDate } from "@/lib/utils";
import type { TenderWithMatch } from "@/server/types";

/** A single tender row used in the dashboard list and the tender feed. */
export function TenderRow({ tender }: { tender: TenderWithMatch }) {
  const days = daysUntil(tender.closesAt);

  return (
    <Link
      href={`/tenders/${tender.id}`}
      className="flex items-center gap-4 rounded-xl border border-line bg-white px-4 py-3.5 transition hover:border-teal/40 hover:shadow-card"
    >
      <IconChip>
        <FileText className="h-5 w-5" aria-hidden />
      </IconChip>

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-semibold text-ink">
          {tender.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate">
          {tender.sector} · {formatPkr(tender.valuePkr)} · {tender.city}
        </p>
      </div>

      <MatchScoreChip score={tender.match.score} size="sm" />

      <div className="w-20 shrink-0 text-right">
        <p
          className={
            days <= 3
              ? "font-display text-sm font-bold text-red"
              : "font-display text-sm font-bold text-ink"
          }
        >
          {days >= 0 ? `${days} days` : "closed"}
        </p>
        <p className="text-xs text-slate">{formatShortDate(tender.closesAt)}</p>
      </div>
    </Link>
  );
}
