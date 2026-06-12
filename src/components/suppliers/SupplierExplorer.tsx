"use client";

import { useEffect, useState } from "react";
import { Search, Star, BadgeCheck, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn, formatPkrExact } from "@/lib/utils";
import type { OfferWithSupplier } from "@/server/suppliers";

const selectClass =
  "h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal";

function OriginBadge({ origin }: { origin: "local" | "import" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-semibold",
        origin === "local"
          ? "bg-green/10 text-green"
          : "bg-gold/15 text-gold2",
      )}
    >
      {origin === "local" ? "Local" : "Import"}
    </span>
  );
}

/**
 * Supplier search and unit-cost comparison (Build Spec section 6.5). Searches
 * the open /api/suppliers endpoint; cheapest-in-category is highlighted.
 */
export function SupplierExplorer({
  categories,
  initialOffers,
}: {
  categories: string[];
  initialOffers: OfferWithSupplier[];
}) {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [origin, setOrigin] = useState("");
  const [offers, setOffers] = useState<OfferWithSupplier[]>(initialOffers);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (category) params.set("category", category);
    if (origin) params.set("origin", origin);

    setBusy(true);
    fetch(`/api/suppliers?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: { offers: OfferWithSupplier[] }) => setOffers(d.offers ?? []))
      .catch(() => {})
      .finally(() => setBusy(false));
    return () => ctrl.abort();
  }, [keyword, category, origin]);

  // Cheapest offer id per item, to flag the best price.
  const cheapestByItem = new Map<string, string>();
  for (const o of offers) {
    const key = o.item.toLowerCase();
    const cur = cheapestByItem.get(key);
    const curPrice = cur ? offers.find((x) => x.id === cur)?.unitPricePkr ?? Infinity : Infinity;
    if (o.unitPricePkr < curPrice) cheapestByItem.set(key, o.id);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier search and cost comparison</CardTitle>
        <span className="label-caps text-slate">{offers.length} offers</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
              aria-hidden
            />
            <label htmlFor="supplier-kw" className="sr-only">
              Search suppliers and items
            </label>
            <input
              id="supplier-kw"
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search items, categories or suppliers..."
              className="h-10 w-full rounded-xl border border-line bg-bg pl-9 pr-3 text-sm text-ink placeholder:text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            />
          </div>
          <label htmlFor="supplier-cat" className="sr-only">
            Category
          </label>
          <select
            id="supplier-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={selectClass}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label htmlFor="supplier-origin" className="sr-only">
            Origin
          </label>
          <select
            id="supplier-origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className={selectClass}
          >
            <option value="">Local and import</option>
            <option value="local">Local only</option>
            <option value="import">Import only</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-slate">
                <th className="py-2 pr-3 font-medium">Item</th>
                <th className="py-2 pr-3 font-medium">Supplier</th>
                <th className="py-2 pr-3 font-medium">Origin</th>
                <th className="py-2 pr-3 text-right font-medium">Unit price</th>
                <th className="py-2 pr-3 text-right font-medium">Lead time</th>
                <th className="py-2 pr-3 text-right font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => {
                const best = cheapestByItem.get(o.item.toLowerCase()) === o.id;
                return (
                  <tr key={o.id} className="border-b border-line/70 align-top">
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-ink">{o.item}</p>
                      <p className="text-xs text-slate">
                        {o.category} · MOQ {o.minOrderQty.toLocaleString()} {o.unit}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="inline-flex items-center gap-1 text-ink">
                        {o.supplierName}
                        {o.supplier.verified && (
                          <BadgeCheck
                            className="h-3.5 w-3.5 text-teal"
                            aria-label="Verified"
                          />
                        )}
                      </span>
                      <p className="text-xs text-slate">
                        {o.supplier.city}, {o.supplier.country}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3">
                      <OriginBadge origin={o.origin} />
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <span
                        className={cn(
                          "font-semibold",
                          best ? "text-green" : "text-ink",
                        )}
                      >
                        {formatPkrExact(o.unitPricePkr)}
                      </span>
                      <span className="block text-xs text-slate">/{o.unit}</span>
                      {best && (
                        <span className="text-[11px] font-semibold text-green">
                          Best price
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-slate">
                      <span className="inline-flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5" aria-hidden />
                        {o.supplier.leadTimeDays}d
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right text-slate">
                      <span className="inline-flex items-center gap-1">
                        <Star
                          className="h-3.5 w-3.5 fill-gold text-gold"
                          aria-hidden
                        />
                        {o.supplier.rating.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {offers.length === 0 && !busy && (
            <p className="py-6 text-center text-sm text-slate">
              No suppliers match these filters.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
