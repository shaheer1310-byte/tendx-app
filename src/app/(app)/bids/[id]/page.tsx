import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { BidEditor } from "@/components/bids/BidEditor";
import { UpgradeGate } from "@/components/plan/UpgradeGate";
import { getBid } from "@/server/bids";
import { isProfessional } from "@/server/plan";

export default async function BidDetailPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isProfessional()) {
    return (
      <>
        <PageHeader title="Bid pack" />
        <UpgradeGate
          feature="Bid generation"
          description="Generate AI-drafted bid packs, edit them, upload certificates and export to PDF."
        />
      </>
    );
  }

  const bid = await getBid(params.id);
  if (!bid) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/bids"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to bids
      </Link>
      <PageHeader
        title="Bid pack"
        subtitle={bid.tenderTitle}
      />
      <BidEditor initialBid={bid} />
    </div>
  );
}
