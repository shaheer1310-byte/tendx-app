import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { IconChip } from "@/components/ui/IconChip";
import { BidStatusBadge } from "@/components/bids/StatusBadges";
import { UpgradeGate } from "@/components/plan/UpgradeGate";
import { listBids } from "@/server/bids";
import { isProfessional } from "@/server/plan";
import { formatShortDate } from "@/lib/utils";

export default async function BidsPage() {
  if (!isProfessional()) {
    return (
      <>
        <PageHeader
          title="Bid Generator"
          subtitle="Draft, track and export compliant bid packs."
        />
        <UpgradeGate
          feature="Bid generation"
          description="Generate AI-drafted bid packs, edit them, upload certificates and export to PDF."
        />
      </>
    );
  }

  const bids = await listBids();

  return (
    <>
      <PageHeader
        title="Bid Generator"
        subtitle="Your bid packs in progress, with status and linked tender."
      />

      {bids.length === 0 ? (
        <Card className="mx-auto max-w-xl">
          <CardContent className="flex flex-col items-center gap-3 px-8 py-14 text-center">
            <IconChip>
              <FileText className="h-5 w-5" aria-hidden />
            </IconChip>
            <p className="font-display font-semibold text-ink">No bids yet</p>
            <p className="max-w-sm text-sm text-slate">
              Open a tender, run the AI Analyzer and choose Generate Bid Pack to
              create your first bid.
            </p>
            <Link
              href="/tenders"
              className="inline-flex items-center gap-1 text-sm font-semibold text-teal2 hover:underline"
            >
              Browse tenders
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bids.map((bid) => (
            <Link
              key={bid.id}
              href={`/bids/${bid.id}`}
              className="flex items-center gap-4 rounded-xl border border-line bg-white px-4 py-3.5 transition hover:border-teal/40 hover:shadow-card"
            >
              <IconChip>
                <FileText className="h-5 w-5" aria-hidden />
              </IconChip>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold text-ink">
                  {bid.tenderTitle}
                </p>
                <p className="mt-0.5 text-xs text-slate">
                  {bid.documents.length} documents · created{" "}
                  {formatShortDate(bid.createdAt)}
                </p>
              </div>
              <BidStatusBadge status={bid.status} />
              <ArrowRight className="h-4 w-4 shrink-0 text-slate" aria-hidden />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
