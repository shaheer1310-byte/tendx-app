import type { TaxEstimate, TaxInput, TaxLine } from "./types";

/**
 * Deterministic profitability and tax calculator (Build Spec sections 6.6 and
 * 9.5). This is plain arithmetic, NOT an LLM call. The LLM only writes the
 * sourcing recommendation text elsewhere.
 */
export const TAX_RATES = {
  gst: 0.18, // GST on value addition (contract value - procurement)
  withholding: 0.045, // withholding tax on contract value
  sst: 0.15, // provincial services sales tax on value addition
  duties: 0.05, // import duties on procurement inputs
} as const;

/** Default cost ratios used to pre-fill the analyzer from a contract value. */
export const COST_RATIOS = {
  procurement: 0.725, // 24.0M contract -> 17.4M procurement (Build Spec 6.3)
  logistics: 0.03, // 24.0M contract -> 0.72M logistics (Build Spec 6.3)
} as const;

const round = (n: number) => Math.round(n);

export function deriveCosts(contractValuePkr: number) {
  return {
    procurementCostPkr: round(contractValuePkr * COST_RATIOS.procurement),
    logisticsOverheadsPkr: round(contractValuePkr * COST_RATIOS.logistics),
  };
}

export function estimate(input: TaxInput): TaxEstimate {
  const C = Math.max(0, input.contractValuePkr);
  const P = Math.max(0, input.procurementCostPkr);
  const L = Math.max(0, input.logisticsOverheadsPkr);
  const valueAddition = Math.max(0, C - P);

  const lines: TaxLine[] = [
    { label: "Contract value", amountPkr: C },
    { label: "Estimated procurement cost", amountPkr: -P },
  ];

  let totalTax = 0;
  if (input.gst) {
    const v = round(TAX_RATES.gst * valueAddition);
    totalTax += v;
    lines.push({ label: "GST (18%) on value addition", amountPkr: -v });
  }
  if (input.withholding) {
    const v = round(TAX_RATES.withholding * C);
    totalTax += v;
    lines.push({ label: "Withholding tax (4.5%)", amountPkr: -v });
  }
  if (input.sst) {
    const v = round(TAX_RATES.sst * valueAddition);
    totalTax += v;
    lines.push({ label: "SST (15%) on value addition", amountPkr: -v });
  }
  if (input.duties) {
    const v = round(TAX_RATES.duties * P);
    totalTax += v;
    lines.push({ label: "Import duties (5%) on inputs", amountPkr: -v });
  }

  lines.push({ label: "Logistics and overheads", amountPkr: -L });

  const netProfit = C - P - L - totalTax;
  const marginPct = C > 0 ? (netProfit / C) * 100 : 0;

  return {
    lines,
    totalTaxPkr: totalTax,
    netProfitPkr: netProfit,
    marginPct: Math.round(marginPct * 10) / 10,
  };
}
