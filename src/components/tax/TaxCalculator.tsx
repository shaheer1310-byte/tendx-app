"use client";

import { useEffect, useState } from "react";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { ProfitabilityTable } from "@/components/analyzer/ProfitabilityTable";
import type { TaxEstimate } from "@/server/types";

interface Initial {
  contractValuePkr: number;
  procurementCostPkr: number;
  logisticsOverheadsPkr: number;
}

const TAXES = [
  { key: "gst", label: "GST (18%)" },
  { key: "withholding", label: "Withholding (4.5%)" },
  { key: "sst", label: "SST (15%)" },
  { key: "duties", label: "Import duties (5%)" },
] as const;

export function TaxCalculator({ initial }: { initial: Initial }) {
  const [contract, setContract] = useState(initial.contractValuePkr);
  const [procurement, setProcurement] = useState(initial.procurementCostPkr);
  const [logistics, setLogistics] = useState(initial.logisticsOverheadsPkr);
  const [taxes, setTaxes] = useState({
    gst: true,
    withholding: true,
    sst: false,
    duties: false,
  });
  const [estimate, setEstimate] = useState<TaxEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function calculate() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/tax/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractValuePkr: contract,
        procurementCostPkr: procurement,
        logisticsOverheadsPkr: logistics,
        ...taxes,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not calculate. Check the inputs.");
      return;
    }
    setEstimate((await res.json()) as TaxEstimate);
  }

  // Calculate once on mount with the initial values.
  useEffect(() => {
    void calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void calculate();
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="contract">Contract value (PKR)</Label>
              <Input
                id="contract"
                type="number"
                min={0}
                value={contract}
                onChange={(e) => setContract(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="procurement">Estimated procurement cost (PKR)</Label>
              <Input
                id="procurement"
                type="number"
                min={0}
                value={procurement}
                onChange={(e) => setProcurement(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="logistics">Logistics and overheads (PKR)</Label>
              <Input
                id="logistics"
                type="number"
                min={0}
                value={logistics}
                onChange={(e) => setLogistics(Number(e.target.value))}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-ink">Applicable taxes</p>
              <div className="grid grid-cols-2 gap-2">
                {TAXES.map((t) => (
                  <label
                    key={t.key}
                    className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-ink"
                  >
                    <input
                      type="checkbox"
                      checked={taxes[t.key]}
                      onChange={(e) =>
                        setTaxes((prev) => ({ ...prev, [t.key]: e.target.checked }))
                      }
                      className="h-4 w-4 accent-teal"
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={busy} className="w-full">
              <Calculator className="h-4 w-4" aria-hidden />
              {busy ? "Calculating..." : "Calculate"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profit and margin</CardTitle>
        </CardHeader>
        <CardContent>
          {estimate ? (
            <ProfitabilityTable estimate={estimate} />
          ) : (
            <p className="text-sm text-slate">Enter values and calculate.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
