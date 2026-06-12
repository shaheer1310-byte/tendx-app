import { PageHeader } from "@/components/layout/PageHeader";
import { TaxCalculator } from "@/components/tax/TaxCalculator";
import { UpgradeGate } from "@/components/plan/UpgradeGate";
import { isProfessional } from "@/server/plan";
import { getTender } from "@/server/tenders";
import { deriveCosts } from "@/server/tax";

export default async function TaxPage({
  searchParams,
}: {
  searchParams: { tenderId?: string };
}) {
  if (!isProfessional()) {
    return (
      <>
        <PageHeader
          title="Tax and Profit"
          subtitle="Estimate GST, withholding tax and duties to see net profit and margin."
        />
        <UpgradeGate
          feature="Profit analytics"
          description="Calculate GST, SST, withholding tax and duties to see net profit and margin before you commit to a bid."
        />
      </>
    );
  }

  // Optionally pre-fill from a tender (Build Spec section 6.6).
  const tender = searchParams.tenderId
    ? await getTender(searchParams.tenderId)
    : null;
  const contractValuePkr = tender?.valuePkr ?? 24_000_000;
  const costs = deriveCosts(contractValuePkr);

  return (
    <>
      <PageHeader
        title="Tax and Profit"
        subtitle={
          tender
            ? `Scenario for: ${tender.title}`
            : "Estimate GST, withholding tax and duties to see net profit and margin."
        }
      />
      <TaxCalculator
        initial={{
          contractValuePkr,
          procurementCostPkr: costs.procurementCostPkr,
          logisticsOverheadsPkr: costs.logisticsOverheadsPkr,
        }}
      />
    </>
  );
}
