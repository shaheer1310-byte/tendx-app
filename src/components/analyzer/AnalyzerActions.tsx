"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Bid } from "@/server/types";

/** "Generate Bid Pack" and "Export PDF" actions for the analyzer (section 6.3). */
export function AnalyzerActions({ tenderId }: { tenderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "generate" | "export">(null);
  const [error, setError] = useState<string | null>(null);

  async function createBid(): Promise<Bid | null> {
    const res = await fetch("/api/bids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenderId }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not generate the bid pack.");
      return null;
    }
    return ((await res.json()) as { bid: Bid }).bid;
  }

  async function onGenerate() {
    setError(null);
    setBusy("generate");
    const bid = await createBid();
    setBusy(null);
    if (bid) {
      router.push(`/bids/${bid.id}`);
      router.refresh();
    }
  }

  async function onExport() {
    setError(null);
    setBusy("export");
    const bid = await createBid();
    if (bid) {
      const res = await fetch(`/api/bids/${bid.id}/export`, { method: "POST" });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bid-pack-${bid.id.slice(0, 8)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        setError("Could not export the PDF.");
      }
    }
    setBusy(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        <Button onClick={onGenerate} disabled={busy !== null}>
          <FileText className="h-4 w-4" aria-hidden />
          {busy === "generate" ? "Generating..." : "Generate Bid Pack"}
        </Button>
        <Button variant="outline" onClick={onExport} disabled={busy !== null}>
          <Download className="h-4 w-4" aria-hidden />
          {busy === "export" ? "Preparing..." : "Export PDF"}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
