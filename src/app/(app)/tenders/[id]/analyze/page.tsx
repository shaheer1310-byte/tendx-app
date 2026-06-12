import Link from "next/link";
import { ArrowLeft, ArrowRight, Lightbulb, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { MatchScoreChip } from "@/components/ui/MatchScoreChip";
import { EligibilityList } from "@/components/tenders/EligibilityList";
import { AnalyzerActions } from "@/components/analyzer/AnalyzerActions";
import { ProfitabilityTable } from "@/components/analyzer/ProfitabilityTable";
import { DocStatusBadge } from "@/components/bids/StatusBadges";
import { UpgradeGate } from "@/components/plan/UpgradeGate";
import { analyzeTender } from "@/server/analyzer";
import { getTender } from "@/server/tenders";
import { isProfessional } from "@/server/plan";
import { formatPkr, formatShortDate } from "@/lib/utils";

export default async function TenderAnalyzePage({
  params,
}: {
  params: { id: string };
}) {
  const tender = await getTender(params.id);
  if (!tender) notFound();

  const backLink = (
    <Link
      href={`/tenders/${tender.id}`}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-ink"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back to tender
    </Link>
  );

  // Plan gating, server-side (Build Spec section 10).
  if (!isProfessional()) {
    return (
      <div className="mx-auto max-w-5xl">
        {backLink}
        <PageHeader title="AI Tender Analyzer" subtitle={tender.title} />
        <UpgradeGate
          feature="The AI Analyzer"
          description="Run requirement extraction, eligibility checks, match scoring, the bid pack and the profit/tax breakdown on any tender."
        />
      </div>
    );
  }

  const analysis = await analyzeTender(params.id);
  if (!analysis) notFound();
  const { insight, bidPack, profitability, sourcing } = analysis;

  return (
    <div className="mx-auto max-w-6xl">
      {backLink}

      {/* Header + big match score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <span className="label-caps text-teal2">{tender.sector}</span>
              <h1 className="mt-2 font-display text-[25px] font-bold leading-tight tracking-tight text-ink">
                {tender.title}
              </h1>
              <p className="mt-1 text-sm text-slate">
                Ref {tender.refNo} · {tender.category} ·{" "}
                {formatPkr(tender.valuePkr)} · closes{" "}
                {formatShortDate(tender.closesAt)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-center rounded-card bg-navy-hero px-8 py-6 text-center text-white">
              <span className="label-caps text-white/70">AI Match Score</span>
              <span className="mt-1 font-display text-5xl font-extrabold">
                {tender.match.score}%
              </span>
              <span className="mt-1 text-xs font-medium text-mint">
                {tender.match.score >= 85
                  ? "STRONG FIT"
                  : tender.match.score >= 70
                    ? "GOOD FIT"
                    : "PARTIAL FIT"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panels 1 and 2 */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Panel 1: Eligibility */}
        <Card>
          <CardHeader>
            <CardTitle>Eligibility Check</CardTitle>
            <MatchScoreChip score={tender.match.score} size="sm" />
          </CardHeader>
          <CardContent>
            <EligibilityList items={tender.match.eligibility} />
          </CardContent>
        </Card>

        {/* Panel 2: Documents and Bid Pack */}
        <Card>
          <CardHeader>
            <CardTitle>Documents and Bid Pack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2.5">
              {bidPack.map((doc) => (
                <li
                  key={doc.type + doc.title}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5"
                >
                  <span className="text-sm font-medium text-ink">
                    {doc.title}
                  </span>
                  <DocStatusBadge status={doc.status} />
                </li>
              ))}
            </ul>

            <div className="flex items-start gap-2 rounded-xl bg-cloud px-3.5 py-3">
              <Lightbulb
                className="mt-0.5 h-4 w-4 shrink-0 text-teal"
                aria-hidden
              />
              <p className="text-sm text-ink">{insight}</p>
            </div>

            <AnalyzerActions tenderId={tender.id} />
          </CardContent>
        </Card>
      </div>

      {/* Panel 3: Profitability and Tax */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Profitability and Tax</CardTitle>
          <span className="label-caps text-slate">Deterministic estimate</span>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProfitabilityTable estimate={profitability} />
          <div className="flex items-start gap-2 rounded-xl bg-cloud px-3.5 py-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
            <div className="space-y-1">
              <p className="text-sm text-ink">{sourcing.text}</p>
              <Link
                href="/suppliers"
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal2 hover:underline"
              >
                Compare suppliers and sourcing in the Supplier Hub
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
