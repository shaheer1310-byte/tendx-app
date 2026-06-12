import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles, CalendarDays, Building2, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { MatchScoreChip } from "@/components/ui/MatchScoreChip";
import { EligibilityList } from "@/components/tenders/EligibilityList";
import { getTender } from "@/server/tenders";
import { daysUntil, formatPkr, formatShortDate } from "@/lib/utils";

export default async function TenderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const tender = await getTender(params.id);
  if (!tender) notFound();

  const days = daysUntil(tender.closesAt);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/tenders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to feed
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="label-caps text-teal2">{tender.sector}</span>
                {tender.imported && (
                  <span className="label-caps rounded-full bg-cloud px-2 py-0.5 text-slate">
                    Imported
                  </span>
                )}
              </div>
              <h1 className="mt-2 font-display text-[25px] font-bold leading-tight tracking-tight text-ink">
                {tender.title}
              </h1>
              <p className="mt-1 text-sm text-slate">Ref {tender.refNo}</p>

              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                <Meta icon={Building2} label="Buyer" value={tender.buyer} />
                <Meta icon={Tag} label="Category" value={tender.category} />
                <Meta
                  icon={Tag}
                  label="Value"
                  value={formatPkr(tender.valuePkr)}
                />
                <Meta
                  icon={CalendarDays}
                  label="Closes"
                  value={`${formatShortDate(tender.closesAt)}${days >= 0 ? ` · ${days} days` : ""}`}
                />
              </dl>
            </div>

            {/* AI Match Score */}
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

          <p className="mt-5 rounded-xl bg-cloud px-4 py-3 text-sm text-ink">
            {tender.match.explanation}
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Eligibility */}
        <Card>
          <CardHeader>
            <CardTitle>Eligibility Check</CardTitle>
            <MatchScoreChip score={tender.match.score} size="sm" />
          </CardHeader>
          <CardContent>
            <EligibilityList items={tender.match.eligibility} />
          </CardContent>
        </Card>

        {/* Requirements / documents (from extraction) */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements and Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {tender.extracted ? (
              <>
                <div>
                  <p className="label-caps mb-2 text-slate">Requirements</p>
                  <ul className="space-y-1.5">
                    {tender.extracted.requirements.map((r) => (
                      <li key={r} className="text-sm text-ink">
                        • {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="label-caps mb-2 text-slate">Documents needed</p>
                  <div className="flex flex-wrap gap-2">
                    {tender.extracted.documentsNeeded.map((d) => (
                      <span
                        key={d}
                        className="rounded-full bg-cloud px-2.5 py-1 text-xs font-medium text-ink"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                {tender.extracted.scope && (
                  <div>
                    <p className="label-caps mb-2 text-slate">Scope</p>
                    <p className="text-sm text-slate">
                      {tender.extracted.scope}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate">
                Run the AI Analyzer to extract requirements and the document
                checklist for this tender.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CTA to the analyzer (Phase 2) */}
      <div className="mt-6 flex flex-col items-center gap-3 rounded-card border border-line bg-white px-6 py-8 text-center shadow-card">
        <p className="font-display text-base font-bold text-ink">
          Ready to go deeper?
        </p>
        <p className="max-w-md text-sm text-slate">
          The AI Tender Analyzer runs the full eligibility check, bid pack and
          profit/tax breakdown, and can generate your bid pack.
        </p>
        <Link href={`/tenders/${tender.id}/analyze`}>
          <Button>
            <Sparkles className="h-4 w-4" aria-hidden />
            Open AI Analyzer
          </Button>
        </Link>
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-slate">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
