import { getAiService } from "@/lib/ai";
import { seedBoqs } from "./data/fixtures";
import { store } from "./store";
import { getTender } from "./tenders";
import { deriveCosts, estimate } from "./tax";
import type {
  BoqItem,
  SourcingLine,
  SourcingPlan,
  Supplier,
  SupplierOffer,
  SupplierOrigin,
} from "./types";

export interface SupplierSearchFilters {
  keyword?: string;
  category?: string;
  origin?: SupplierOrigin;
}

/** A priced offer joined with its supplier metadata, for the comparison table. */
export interface OfferWithSupplier extends SupplierOffer {
  supplier: Pick<
    Supplier,
    "city" | "province" | "country" | "rating" | "leadTimeDays" | "verified"
  >;
}

/**
 * Search the Supplier Hub by item/category and origin, returning priced offers
 * sorted cheapest-first within a category (Build Spec section 6.5). This is
 * discovery-style data and stays open across plans; the margin-impact planner
 * below is the Professional feature.
 */
export function searchSuppliers(
  filters: SupplierSearchFilters = {},
): OfferWithSupplier[] {
  const kw = filters.keyword?.trim().toLowerCase();
  const byId = new Map(store.suppliers.map((s) => [s.id, s]));

  return store.offers
    .filter((o) => {
      if (filters.category && o.category !== filters.category) return false;
      if (filters.origin && o.origin !== filters.origin) return false;
      if (kw) {
        const hay = `${o.item} ${o.category} ${o.supplierName}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    })
    .map((o) => {
      const s = byId.get(o.supplierId);
      return {
        ...o,
        supplier: {
          city: s?.city ?? "",
          province: s?.province ?? "",
          country: s?.country ?? "",
          rating: s?.rating ?? 0,
          leadTimeDays: s?.leadTimeDays ?? 0,
          verified: s?.verified ?? false,
        },
      };
    })
    .sort(
      (a, b) =>
        a.category.localeCompare(b.category) || a.unitPricePkr - b.unitPricePkr,
    );
}

/** The distinct categories available in the hub, for the filter dropdown. */
export function supplierCategories(): string[] {
  return Array.from(new Set(store.offers.map((o) => o.category))).sort();
}

/**
 * The bill of quantities for a tender. Falls back to a single synthetic line
 * built from the derived procurement cost when no explicit BOQ is seeded.
 */
function getBoq(tenderId: string, valuePkr: number, category: string): BoqItem[] {
  const explicit = seedBoqs[tenderId];
  if (explicit && explicit.length) return explicit;
  const { procurementCostPkr } = deriveCosts(valuePkr);
  return [
    {
      item: "Primary inputs",
      category,
      qty: 1,
      unit: "lot",
      baselineUnitPricePkr: procurementCostPkr,
    },
  ];
}

/** Cheapest offer for an item that undercuts the given baseline, if any. */
function cheapestCheaperOffer(
  category: string,
  item: string,
  baselineUnitPricePkr: number,
): SupplierOffer | undefined {
  return store.offers
    .filter(
      (o) =>
        o.category === category &&
        o.item.toLowerCase() === item.toLowerCase() &&
        o.unitPricePkr < baselineUnitPricePkr,
    )
    .sort((a, b) => a.unitPricePkr - b.unitPricePkr)[0];
}

/**
 * Build the full sourcing plan for a tender: for each BOQ line find the
 * cheapest cheaper offer, then quantify the margin impact by running the
 * DETERMINISTIC tax calculator (Build Spec section 9.5) before and after the
 * savings. The LLM only writes the narrative sentence (section 9.6).
 *
 * Pure data + arithmetic; plan gating is enforced by the API route and page.
 */
export async function sourcingPlan(tenderId: string): Promise<SourcingPlan | null> {
  const tender = await getTender(tenderId);
  if (!tender) return null;

  const boq = getBoq(tenderId, tender.valuePkr, tender.category);

  let bestOverall: { name: string; origin: SupplierOrigin; savings: number } | null =
    null;

  const lines: SourcingLine[] = boq.map((b) => {
    const baselineLineTotalPkr = b.qty * b.baselineUnitPricePkr;
    const offer = cheapestCheaperOffer(
      b.category,
      b.item,
      b.baselineUnitPricePkr,
    );
    const line: SourcingLine = {
      item: b.item,
      qty: b.qty,
      unit: b.unit,
      baselineUnitPricePkr: b.baselineUnitPricePkr,
      baselineLineTotalPkr,
      savingsPkr: 0,
    };
    if (offer) {
      const lineTotalPkr = b.qty * offer.unitPricePkr;
      const savingsPkr = baselineLineTotalPkr - lineTotalPkr;
      line.best = {
        supplierName: offer.supplierName,
        origin: offer.origin,
        unitPricePkr: offer.unitPricePkr,
        lineTotalPkr,
      };
      line.savingsPkr = savingsPkr;
      if (!bestOverall || savingsPkr > bestOverall.savings) {
        bestOverall = {
          name: offer.supplierName,
          origin: offer.origin,
          savings: savingsPkr,
        };
      }
    }
    return line;
  });

  const baselineProcurementPkr = lines.reduce(
    (sum, l) => sum + l.baselineLineTotalPkr,
    0,
  );
  const totalSavingsPkr = lines.reduce((sum, l) => sum + l.savingsPkr, 0);
  const optimizedProcurementPkr = baselineProcurementPkr - totalSavingsPkr;

  // Margin impact via the deterministic calculator (same taxes as the analyzer
  // Panel 3), holding logistics and taxes constant so the delta is the saving.
  const { logisticsOverheadsPkr } = deriveCosts(tender.valuePkr);
  const taxes = { gst: true, withholding: true, sst: false, duties: false };
  const baseEstimate = estimate({
    contractValuePkr: tender.valuePkr,
    procurementCostPkr: baselineProcurementPkr,
    logisticsOverheadsPkr,
    ...taxes,
  });
  const optEstimate = estimate({
    contractValuePkr: tender.valuePkr,
    procurementCostPkr: optimizedProcurementPkr,
    logisticsOverheadsPkr,
    ...taxes,
  });
  const marginLiftPct =
    Math.round((optEstimate.marginPct - baseEstimate.marginPct) * 10) / 10;

  // Narrative: the only generative part. Figures above are passed in verbatim.
  const ai = getAiService();
  const best = bestOverall as
    | { name: string; origin: SupplierOrigin; savings: number }
    | null;
  const { text } = await ai.sourcingRecommendation({
    tenderTitle: tender.title,
    inputCostPkr: baselineProcurementPkr,
    bestSupplier: best?.name,
    bestOrigin: best?.origin,
    savingsPkr: totalSavingsPkr,
    marginLiftPct,
  });

  return {
    tenderId,
    tenderTitle: tender.title,
    lines,
    baselineProcurementPkr,
    optimizedProcurementPkr,
    totalSavingsPkr,
    baselineMarginPct: baseEstimate.marginPct,
    optimizedMarginPct: optEstimate.marginPct,
    marginLiftPct,
    narrative: text,
  };
}

/** Tenders that have a sourcing-eligible BOQ, for the Supplier Hub picker. */
export function sourceableTenders() {
  return store.tenders
    .filter((t) => seedBoqs[t.id])
    .map((t) => ({ id: t.id, title: t.title, category: t.category }));
}
