import { formatPkrExact } from "@/lib/utils";
import type { TaxEstimate } from "@/server/types";

/** Cost breakdown + net profit/margin (Build Spec sections 6.3 panel 3, 6.6). */
export function ProfitabilityTable({ estimate }: { estimate: TaxEstimate }) {
  return (
    <div>
      <table className="w-full text-sm">
        <tbody>
          {estimate.lines.map((line, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              <td className="py-2.5 text-ink">{line.label}</td>
              <td
                className={
                  line.amountPkr < 0
                    ? "py-2.5 text-right font-display font-semibold text-red"
                    : "py-2.5 text-right font-display font-semibold text-ink"
                }
              >
                {line.amountPkr < 0 ? "- " : ""}
                {formatPkrExact(Math.abs(line.amountPkr))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-cloud px-4 py-3.5">
        <div>
          <p className="label-caps text-slate">Estimated Net Profit</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-green">
            {formatPkrExact(estimate.netProfitPkr)}
          </p>
        </div>
        <div className="text-right">
          <p className="label-caps text-slate">Margin</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-ink">
            {estimate.marginPct}%
          </p>
        </div>
      </div>
    </div>
  );
}
