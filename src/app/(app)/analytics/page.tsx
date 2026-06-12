import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PipelineDonut } from "@/components/dashboard/PipelineDonut";
import { GroupedBars } from "@/components/analytics/GroupedBars";
import { ScoreHistogram } from "@/components/analytics/ScoreHistogram";
import { CategoryBars } from "@/components/analytics/CategoryBars";
import { UpgradeGate } from "@/components/plan/UpgradeGate";
import { getAnalyticsSummary } from "@/server/analytics";
import { isProfessional } from "@/server/plan";
import { formatPkr } from "@/lib/utils";

export default function AnalyticsPage() {
  if (!isProfessional()) {
    return (
      <>
        <PageHeader
          title="Analytics"
          subtitle="Win rate, value won, bid pipeline and match-score trends."
        />
        <UpgradeGate
          feature="Analytics"
          description="Track win rate, value won, bids over time and your match-score distribution across the company's bidding activity."
        />
      </>
    );
  }

  const a = getAnalyticsSummary();

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Win rate, value won, bid pipeline and match-score trends."
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Win rate"
          value={`${a.winRatePct}%`}
          trend={`+${a.winRateDelta}% vs last 6 mo`}
        />
        <KpiCard label="Bids submitted" value={String(a.bidsSubmitted)} />
        <KpiCard label="Value won" value={formatPkr(a.valueWonPkr)} />
        <KpiCard
          label="Avg match score"
          value={`${a.avgMatchScore}%`}
          accent
          trend={`${formatPkr(a.pipelineValuePkr)} in pipeline`}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bids submitted vs won</CardTitle>
            <span className="label-caps text-slate">Last 6 months</span>
          </CardHeader>
          <CardContent>
            <GroupedBars data={a.monthly} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bid pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineDonut pipeline={a.pipeline} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top categories by value</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBars data={a.topCategories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Match-score distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreHistogram data={a.scoreDistribution} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
