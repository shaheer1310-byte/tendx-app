import Link from "next/link";
import { Plus, SearchX } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/tenders/FilterBar";
import { TenderRow } from "@/components/tenders/TenderRow";
import { listTenders } from "@/server/tenders";
import type { BuyerType, TenderFilters } from "@/server/types";

const BUYER_TYPES = ["federal", "provincial", "military", "soe", "private"];

function str(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}

function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (s === undefined) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

type SearchParams = { [key: string]: string | string[] | undefined };

function toFilters(sp: SearchParams): TenderFilters {
  const buyerType = str(sp.buyerType);
  const sort = str(sp.sort);
  return {
    keyword: str(sp.keyword),
    sector: str(sp.sector),
    province: str(sp.province),
    buyerType:
      buyerType && BUYER_TYPES.includes(buyerType)
        ? (buyerType as BuyerType)
        : undefined,
    minValue: num(sp.minValue),
    maxValue: num(sp.maxValue),
    closingWithinDays: num(sp.closingWithinDays),
    sourcePortal: str(sp.sourcePortal),
    sort:
      sort === "deadline" || sort === "value" || sort === "recency"
        ? sort
        : "score",
  };
}

export default async function TenderFeedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = toFilters(searchParams);
  const tenders = await listTenders(filters);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Tender Feed"
          subtitle="Aggregated tenders with per-company match scores, filters and deadlines."
        />
        <Link href="/tenders/import">
          <Button size="sm">
            <Plus className="h-4 w-4" aria-hidden />
            Import tender
          </Button>
        </Link>
      </div>

      <FilterBar />

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-slate">
          {tenders.length} {tenders.length === 1 ? "tender" : "tenders"}
        </p>
      </div>

      <div className="mt-3 space-y-3">
        {tenders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-card border border-line bg-white px-6 py-16 text-center shadow-card">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-cloud text-slate">
              <SearchX className="h-6 w-6" aria-hidden />
            </span>
            <p className="font-display font-semibold text-ink">
              No tenders match these filters
            </p>
            <p className="max-w-sm text-sm text-slate">
              Try widening your filters, or import a tender by paste or URL.
            </p>
          </div>
        ) : (
          tenders.map((tender) => (
            <TenderRow key={tender.id} tender={tender} />
          ))
        )}
      </div>
    </>
  );
}
