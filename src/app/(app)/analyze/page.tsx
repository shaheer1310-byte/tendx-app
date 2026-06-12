import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { IconChip } from "@/components/ui/IconChip";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { listTenders } from "@/server/tenders";
import { MatchScoreChip } from "@/components/ui/MatchScoreChip";

export default async function AnalyzerLandingPage() {
  const top = (await listTenders({ sort: "score" })).slice(0, 4);

  return (
    <>
      <PageHeader
        title="AI Tender Analyzer"
        subtitle="Pick a tender to run eligibility, match scoring, the bid pack and the profit/tax breakdown."
      />

      <Card className="mx-auto max-w-2xl">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-3">
            <IconChip>
              <Sparkles className="h-5 w-5" aria-hidden />
            </IconChip>
            <p className="text-sm text-slate">
              The analyzer runs per tender. Choose one of your top matches or
              browse the full feed.
            </p>
          </div>

          <ul className="space-y-2">
            {top.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tenders/${t.id}/analyze`}
                  className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 transition hover:border-teal/40 hover:shadow-card"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                    {t.title}
                  </span>
                  <MatchScoreChip score={t.match.score} size="sm" />
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>

          <Link href="/tenders">
            <Button variant="outline" className="w-full">
              Browse all tenders
            </Button>
          </Link>
        </CardContent>
      </Card>
    </>
  );
}
