import { cn } from "@/lib/utils";
import type { BidDocumentStatus, BidStatus } from "@/server/types";

const DOC_STATUS: Record<BidDocumentStatus, { label: string; cls: string }> = {
  ai_generated: { label: "AI-GENERATED", cls: "bg-teal/12 text-teal2" },
  drafted: { label: "DRAFTED", cls: "bg-gold/20 text-ink" },
  ready: { label: "READY", cls: "bg-green/12 text-green" },
  missing: { label: "MISSING", cls: "bg-red/12 text-red" },
};

export function DocStatusBadge({ status }: { status: BidDocumentStatus }) {
  const s = DOC_STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        s.cls,
      )}
    >
      {s.label}
    </span>
  );
}

const BID_STATUS: Record<BidStatus, { label: string; cls: string }> = {
  drafted: { label: "Drafted", cls: "bg-cloud text-slate" },
  win_ready: { label: "Win-ready", cls: "bg-green/12 text-green" },
  missing_docs: { label: "Missing documents", cls: "bg-red/12 text-red" },
  under_review: { label: "Under review", cls: "bg-gold/20 text-ink" },
  submitted: { label: "Submitted", cls: "bg-teal/12 text-teal2" },
};

export function BidStatusBadge({ status }: { status: BidStatus }) {
  const s = BID_STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        s.cls,
      )}
    >
      {s.label}
    </span>
  );
}
