"use client";

import { useState } from "react";
import { Download, RefreshCw, Save, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DocStatusBadge } from "@/components/bids/StatusBadges";
import type { Bid, BidDocument, BidStatus } from "@/server/types";

const STATUS_OPTIONS: BidStatus[] = [
  "drafted",
  "win_ready",
  "missing_docs",
  "under_review",
  "submitted",
];

const EDITABLE = new Set(["cover_letter", "technical_proposal", "financial_bid"]);

export function BidEditor({ initialBid }: { initialBid: Bid }) {
  const [docs, setDocs] = useState<BidDocument[]>(initialBid.documents);
  const [status, setStatus] = useState<BidStatus>(initialBid.status);
  const [busy, setBusy] = useState<null | string>(null);
  const [note, setNote] = useState<string | null>(null);

  function setContent(type: string, content: string) {
    setDocs((prev) =>
      prev.map((d) => (d.type === type ? { ...d, content } : d)),
    );
  }

  function onUpload(title: string, file: File | null) {
    if (!file) return;
    setDocs((prev) =>
      prev.map((d) =>
        d.title === title
          ? { ...d, status: "ready", fileName: file.name }
          : d,
      ),
    );
    setNote(`Attached ${file.name}. Remember to save.`);
  }

  async function persist(nextStatus?: BidStatus) {
    setBusy(nextStatus === "submitted" ? "submit" : "save");
    setNote(null);
    const res = await fetch(`/api/bids/${initialBid.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documents: docs, status: nextStatus ?? status }),
    });
    setBusy(null);
    if (!res.ok) {
      setNote("Could not save. Please try again.");
      return;
    }
    const { bid } = (await res.json()) as { bid: Bid };
    setStatus(bid.status);
    setNote(
      nextStatus === "submitted" ? "Bid marked as submitted." : "Saved.",
    );
  }

  async function regenerate() {
    setBusy("regen");
    setNote(null);
    const res = await fetch(`/api/bids/${initialBid.id}/generate`, {
      method: "POST",
    });
    setBusy(null);
    if (res.ok) {
      const { bid } = (await res.json()) as { bid: Bid };
      setDocs(bid.documents);
      setNote("AI-drafted sections regenerated.");
    }
  }

  async function exportPdf() {
    setBusy("export");
    const res = await fetch(`/api/bids/${initialBid.id}/export`, {
      method: "POST",
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bid-pack-${initialBid.id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setBusy(null);
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <label htmlFor="bid-status" className="text-sm font-medium text-ink">
            Status
          </label>
          <select
            id="bid-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as BidStatus)}
            className="h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>

          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={regenerate} disabled={busy !== null}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              {busy === "regen" ? "Regenerating..." : "Regenerate AI"}
            </Button>
            <Button variant="outline" size="sm" onClick={exportPdf} disabled={busy !== null}>
              <Download className="h-4 w-4" aria-hidden />
              {busy === "export" ? "Preparing..." : "Export PDF"}
            </Button>
            <Button size="sm" onClick={() => persist()} disabled={busy !== null}>
              <Save className="h-4 w-4" aria-hidden />
              {busy === "save" ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {note && (
        <p className="rounded-lg bg-teal/10 px-3 py-2 text-sm text-teal2" role="status">
          {note}
        </p>
      )}

      {/* Document sections */}
      {docs.map((doc) => (
        <Card key={doc.type + doc.title}>
          <CardHeader>
            <CardTitle>{doc.title}</CardTitle>
            <DocStatusBadge status={doc.status} />
          </CardHeader>
          <CardContent>
            {EDITABLE.has(doc.type) ? (
              <>
                {doc.status === "ai_generated" && (
                  <p className="mb-2 text-xs text-slate">
                    AI-generated draft - edit freely before submitting.
                  </p>
                )}
                <textarea
                  value={doc.content ?? ""}
                  onChange={(e) => setContent(doc.type, e.target.value)}
                  rows={doc.type === "financial_bid" ? 5 : 7}
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                />
              </>
            ) : doc.type === "compliance_checklist" ? (
              <p className="text-sm text-slate">
                All mandatory compliance items are in order.
              </p>
            ) : (
              // certificate upload slot
              <div className="flex flex-col gap-3 rounded-xl border border-dashed border-line px-4 py-5 text-center">
                {doc.fileName ? (
                  <p className="inline-flex items-center justify-center gap-1.5 text-sm text-green">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    {doc.fileName}
                  </p>
                ) : (
                  <p className="text-sm text-slate">
                    {doc.title} is required and not yet on file.
                  </p>
                )}
                <label className="mx-auto inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-cloud">
                  <Upload className="h-4 w-4" aria-hidden />
                  {doc.fileName ? "Replace file" : "Upload certificate"}
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(e) => onUpload(doc.title, e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Human-in-the-loop submit (Build Spec section 9 guardrails) */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <p className="text-sm text-slate">
            Review every section before submitting. AI drafts are a starting
            point, not a final bid.
          </p>
          <Button
            variant="gold"
            onClick={() => persist("submitted")}
            disabled={busy !== null || status === "submitted"}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {status === "submitted" ? "Submitted" : "Mark as submitted"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
