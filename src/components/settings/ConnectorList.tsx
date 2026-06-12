"use client";

import { useState } from "react";
import { Plug, Landmark, Receipt, CreditCard, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectorInfo, ConnectorKind } from "@/server/connectors";

const KIND_META: Record<
  ConnectorKind,
  { label: string; icon: typeof Plug }
> = {
  tender_portal: { label: "Tender portals", icon: Landmark },
  tax: { label: "Tax data", icon: Receipt },
  payment: { label: "Payment gateways", icon: CreditCard },
};

const statusStyles: Record<ConnectorInfo["status"], string> = {
  planned: "bg-cloud text-slate",
  beta: "bg-gold/15 text-gold2",
  live: "bg-green/10 text-green",
};

/**
 * Integrations catalogue (Build Spec section 12 Phase 4). Read-only design
 * surface: connectors are `planned`, and "Run sync" demonstrates the contract
 * by surfacing the API's 501 Not Implemented response.
 */
export function ConnectorList({
  connectors,
  canManage,
}: {
  connectors: ConnectorInfo[];
  canManage: boolean;
}) {
  const [note, setNote] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const kinds: ConnectorKind[] = ["tender_portal", "tax", "payment"];

  async function runSync(id: string) {
    setBusyId(id);
    setNote(null);
    const res = await fetch(`/api/connectors/${id}/sync`, { method: "POST" });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusyId(null);
    setNote(
      res.status === 501
        ? `${id}: ${body.error ?? "Planned - not yet implemented."}`
        : `${id}: ${body.error ?? "Sync triggered."}`,
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate">
        These connectors will ingest public tender data and tax/payment services
        into TendX. They are designed and <strong className="text-ink">planned</strong>;
        the ingestion service that runs them is built out as the connectors land.
      </p>

      {note && (
        <p className="rounded-lg bg-cloud px-3 py-2 text-sm text-ink" role="status">
          {note}
        </p>
      )}

      {kinds.map((kind) => {
        const group = connectors.filter((c) => c.kind === kind);
        if (group.length === 0) return null;
        const Meta = KIND_META[kind];
        const Icon = Meta.icon;
        return (
          <div key={kind}>
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-4 w-4 text-slate" aria-hidden />
              <h3 className="label-caps text-slate">{Meta.label}</h3>
            </div>
            <ul className="divide-y divide-line rounded-card border border-line">
              {group.map((c) => (
                <li key={c.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cloud text-teal">
                    <Plug className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{c.name}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                          statusStyles[c.status],
                        )}
                      >
                        {c.status}
                      </span>
                      <span className="label-caps rounded-full bg-cloud px-2 py-0.5 text-slate">
                        {c.region}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate">{c.description}</p>
                    <p className="mt-1 text-xs text-slate">
                      <span className="font-medium text-ink">Ingests:</span>{" "}
                      {c.ingests} · <span className="font-medium text-ink">Auth:</span>{" "}
                      {c.authType.replace("_", " ")} ·{" "}
                      <span className="font-medium text-ink">Cadence:</span> {c.cadence}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => runSync(c.id)}
                    disabled={!canManage || busyId === c.id}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-line px-3 text-xs font-medium text-slate transition hover:bg-cloud disabled:opacity-50"
                    title={canManage ? "Trigger a sync (planned)" : "Requires admin or owner"}
                  >
                    <RefreshCw
                      className={cn("h-3.5 w-3.5", busyId === c.id && "animate-spin")}
                      aria-hidden
                    />
                    Run sync
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
