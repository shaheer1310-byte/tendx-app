import { PageHeader } from "@/components/layout/PageHeader";
import { SupplierExplorer } from "@/components/suppliers/SupplierExplorer";
import { SourcingPanel } from "@/components/suppliers/SourcingPanel";
import { UpgradeGate } from "@/components/plan/UpgradeGate";
import {
  searchSuppliers,
  sourceableTenders,
  supplierCategories,
} from "@/server/suppliers";
import { isProfessional } from "@/server/plan";

export default function SuppliersPage() {
  // Cost comparison (search) is open; the margin planner is Professional (§10).
  const offers = searchSuppliers();
  const categories = supplierCategories();
  const tenders = sourceableTenders();
  const professional = isProfessional();

  return (
    <>
      <PageHeader
        title="Supplier Hub"
        subtitle="Discover suppliers, compare unit costs and find cheaper sourcing for a bid."
      />

      <div className="space-y-6">
        <SupplierExplorer categories={categories} initialOffers={offers} />

        {professional ? (
          <SourcingPanel tenders={tenders} />
        ) : (
          <UpgradeGate
            feature="Sourcing and margin analytics"
            description="See cheaper-sourcing options for a tender's bill of quantities and the exact margin lift, computed from the Supplier Hub."
          />
        )}
      </div>
    </>
  );
}
