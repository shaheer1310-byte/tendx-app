"use client";

import { useEffect, useState } from "react";
import { ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatPkrExact } from "@/lib/utils";
import type { SourcingPlan } from "@/server/types";

const selectClass =
  "h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal";

interface SourceableTender {
  id: string;
  title: string;
  category: string;
}

/**
 * Sourcing recommendations for a tender's BOQ with the margin impact (Build
 * Spec sections 6.5 and 9.6). The figures are computed server-side by the
 * deterministic planner; this component only renders them.
 */
export function SourcingPanel({ tenders }: { tenders: SourceableTender[] }) {
  const [tenderId, setTenderId] = useState(tenders[0]?.id ?? "");
  const [plan, setPlan] = useState<SourcingPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenderId) return;
    const ctrl = new AbortController();
    setBusy(true);
    setError(null);
    fetch(`/api/suppliers/sourcing/${tenderId}`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        return (await r.json()) as SourcingPlan;
      })
      .then(setPlan)
      .catch((e) => {
        if (e.name !== "AbortError") setError("Could not load sourcing plan.");
      })
      .finally(() => setBusy(false));
    return () => ctrl.abort();
  }, [tenderId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sourcing and margin impact</CardTitle>
        <span className="label-caps text-slate">Deterministic estimate</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="sourcing-tender" className="mb-1.5 block text-sm font-medium text-ink">
            Tender BOQ to optimise
          </label>
          <select
            id="sourcing-tender"
            value={tenderId}
            onChange={(e) => setTenderId(e.target.value)}
            className={selectClass}
          >
            {tenders.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red" role="alert">
            {error}
          </p>
        )}
        {busy && !plan && <p className="text-sm text-slate">Loading...</p>}

        {plan && (
          <>
            {/* Margin before -> after */}
            <div className="flex items-center justify-between gap-3 rounded-card bg-navy-hero px-5 py-4 text-white">
              <div>
                <p className="label-caps text-white/70">Margin</p>
                <p className="mt-0.5 font-display text-lg font-bold">
                  {plan.baselineMarginPct.toFixed(1)}%
                  <ArrowRight className="mx-2 inline h-4 w-4 text-mint" aria-hidden />
                  <span className="text-mint">
                    {plan.optimizedMarginPct.toFixed(1)}%
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="label-caps text-white/70">Lift</p>
                <p className="mt-0.5 inline-flex items-center gap-1 font-display text-lg font-bold text-mint">
                  <TrendingUp className="h-4 w-4" aria-hidden />+
                  {plan.marginLiftPct.toFixed(1)} pts
                </p>
              </div>
            </div>

            {/* Per-line sourcing */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-slate">
                    <th className="py-2 pr-3 font-medium">Input</th>
                    <th className="py-2 pr-3 text-right font-medium">Baseline</th>
                    <th className="py-2 pr-3 font-medium">Cheaper source</th>
                    <th className="py-2 pr-3 text-right font-medium">Saving</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.lines.map((l) => (
                    <tr key={l.item} className="border-b border-line/70 align-top">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-ink">{l.item}</p>
                        <p className="text-xs text-slate">
                          {l.qty.toLocaleString()} {l.unit} @{" "}
                          {formatPkrExact(l.baselineUnitPricePkr)}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3 text-right text-slate">
                        {formatPkrExact(l.baselineLineTotalPkr)}
                      </td>
                      <td className="py-2.5 pr-3">
                        {l.best ? (
                          <>
                            <p className="text-ink">{l.best.supplierName}</p>
                            <p className="text-xs text-slate">
                              {l.best.origin === "local" ? "Local" : "Import"} @{" "}
                              {formatPkrExact(l.best.unitPricePkr)}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-slate">
                            No cheaper offer
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-semibold text-green">
                        {l.savingsPkr > 0 ? formatPkrExact(l.savingsPkr) : "—"}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold text-ink">
                    <td className="py-2.5 pr-3">Total procurement saving</td>
                    <td className="py-2.5 pr-3 text-right text-slate line-through">
                      {formatPkrExact(plan.baselineProcurementPkr)}
                    </td>
                    <td className="py-2.5 pr-3 text-ink">
                      {formatPkrExact(plan.optimizedProcurementPkr)}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-green">
                      {formatPkrExact(plan.totalSavingsPkr)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* AI narrative */}
            <div className="flex items-start gap-2 rounded-xl bg-cloud px-3.5 py-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden />
              <p className="text-sm text-ink">{plan.narrative}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
