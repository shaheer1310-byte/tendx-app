"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import type { TenderWithMatch } from "@/server/types";

export default function ImportTenderPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const valueRaw = String(form.get("valuePkr") ?? "").trim();
    const payload = {
      title: String(form.get("title") ?? ""),
      buyer: String(form.get("buyer") ?? ""),
      sector: String(form.get("sector") ?? ""),
      category: String(form.get("category") ?? ""),
      city: String(form.get("city") ?? ""),
      province: String(form.get("province") ?? ""),
      closesAt: String(form.get("closesAt") ?? ""),
      valuePkr: valueRaw ? Number(valueRaw) : undefined,
      rawUrl: String(form.get("rawUrl") ?? ""),
      rawText: String(form.get("rawText") ?? ""),
    };

    const res = await fetch("/api/tenders/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(data?.error ?? "Could not import this tender.");
      setLoading(false);
      return;
    }

    const data = (await res.json()) as { tender: TenderWithMatch };
    router.push(`/tenders/${data.tender.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/tenders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to feed
      </Link>
      <PageHeader
        title="Import a tender"
        subtitle="Paste the tender text or add a source URL. We extract the requirements and score it against your profile."
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label htmlFor="title">Tender title</Label>
              <Input
                id="title"
                name="title"
                required
                minLength={3}
                placeholder="Supply of Hospital Linen, Civil Hospital Karachi"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="buyer">Buyer</Label>
                <Input id="buyer" name="buyer" placeholder="Civil Hospital Karachi" />
              </div>
              <div>
                <Label htmlFor="sector">Sector</Label>
                <Input id="sector" name="sector" placeholder="Healthcare" />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="Textiles" />
              </div>
              <div>
                <Label htmlFor="valuePkr">Value (PKR)</Label>
                <Input
                  id="valuePkr"
                  name="valuePkr"
                  type="number"
                  min={0}
                  step={100000}
                  placeholder="12000000"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" placeholder="Karachi" />
              </div>
              <div>
                <Label htmlFor="province">Province</Label>
                <Input id="province" name="province" placeholder="Sindh" />
              </div>
              <div>
                <Label htmlFor="closesAt">Closing date</Label>
                <Input id="closesAt" name="closesAt" type="date" />
              </div>
              <div>
                <Label htmlFor="rawUrl">Source URL (optional)</Label>
                <Input
                  id="rawUrl"
                  name="rawUrl"
                  type="url"
                  placeholder="https://ppra.org.pk/..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="rawText">Tender text to paste</Label>
              <textarea
                id="rawText"
                name="rawText"
                rows={6}
                placeholder="Paste the tender notice, eligibility criteria and scope here..."
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              />
              <p className="mt-1.5 text-xs text-slate">
                Provide pasted text or a source URL. The AI extraction runs in
                mock mode, so no API key is needed.
              </p>
            </div>

            {error && (
              <p className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red" role="alert">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <Link href="/tenders">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? "Importing..." : "Import and score"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
