import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PipelineDonut } from "@/components/dashboard/PipelineDonut";
import { TenderRow } from "@/components/tenders/TenderRow";
import { getDashboardSummary } from "@/server/dashboard";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth().catch(() => null);
  const summary = await getDashboardSummary();
  // Default to the demo contact's first name (Build Spec sections 6.1 and 11).
  const firstName = session?.user?.name?.split(" ")[0] ?? "Ali";

  return (
    <>
      <PageHeader
        title={`Good morning, ${firstName}`}
        subtitle={`You have ${summary.matchedTenders} newly matched tenders and ${summary.deadlines7d} deadlines this week.`}
      />

      {/* KPI row (Build Spec section 6.1) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Matched Tenders"
          value={String(summary.matchedTenders)}
          trend={`▲ ${summary.matchedDelta} this week`}
        />
        <KpiCard
          label="Active Bids"
          value={String(summary.activeBids)}
          trend={`${summary.activeInProgress} in progress`}
        />
        <KpiCard
          label="Deadlines / 7 days"
          value={String(summary.deadlines7d)}
          trend="On track"
        />
        <KpiCard
          label="Avg Match Score"
          value={`${summary.avgMatchScore}%`}
          trend={`▲ ${summary.avgDelta}% vs last month`}
          accent
        />
      </div>

      {/* Two-column content */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>AI-Matched Tenders</CardTitle>
            <Link
              href="/tenders"
              className="inline-flex items-center gap-1 text-sm font-semibold text-teal2 hover:underline"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.matchedList.map((tender) => (
              <TenderRow key={tender.id} tender={tender} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bid Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineDonut pipeline={summary.pipeline} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
