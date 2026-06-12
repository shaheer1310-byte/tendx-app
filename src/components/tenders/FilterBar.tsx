"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const SECTORS = [
  "Defense",
  "Healthcare",
  "IT and Software",
  "Construction",
  "General",
];
const PROVINCES = ["Sindh", "Punjab", "KPK", "Balochistan", "Federal"];
const BUYER_TYPES = [
  { value: "federal", label: "Federal" },
  { value: "provincial", label: "Provincial" },
  { value: "military", label: "Military" },
  { value: "soe", label: "SOE" },
  { value: "private", label: "Private" },
];
const SOURCES = ["PPRA", "Imported (paste)", "Imported (URL)"];

const selectClass =
  "h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal";

/** Search + filter bar for the tender feed (Build Spec section 6.2). */
export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [alertOn, setAlertOn] = useState(false);

  function get(key: string) {
    return params.get(key) ?? "";
  }

  function apply(form: HTMLFormElement) {
    const data = new FormData(form);
    const next = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      const v = String(value).trim();
      if (v) next.set(key, v);
    }
    startTransition(() => {
      router.push(`/tenders${next.toString() ? `?${next}` : ""}`);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
      onChange={(e) => apply(e.currentTarget)}
      className="space-y-4 rounded-card border border-line bg-white p-4 shadow-card"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
            aria-hidden
          />
          <label htmlFor="keyword" className="sr-only">
            Search tenders
          </label>
          <input
            id="keyword"
            name="keyword"
            type="search"
            defaultValue={get("keyword")}
            placeholder="Search tenders, buyers, categories..."
            className="h-10 w-full rounded-xl border border-line bg-bg pl-9 pr-3 text-sm text-ink placeholder:text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          />
        </div>

        <label htmlFor="sort" className="sr-only">
          Sort by
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={get("sort") || "score"}
          className={selectClass}
        >
          <option value="score">Sort: Match score</option>
          <option value="deadline">Sort: Deadline</option>
          <option value="value">Sort: Value</option>
          <option value="recency">Sort: Recency</option>
        </select>

        <button
          type="button"
          onClick={() => setAlertOn((v) => !v)}
          aria-pressed={alertOn}
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition",
            alertOn
              ? "border-teal bg-teal/10 text-teal2"
              : "border-line bg-white text-slate hover:bg-cloud",
          )}
        >
          {alertOn ? (
            <BellRing className="h-4 w-4" aria-hidden />
          ) : (
            <Bell className="h-4 w-4" aria-hidden />
          )}
          {alertOn ? "Alerts on" : "Notify me"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <select name="sector" defaultValue={get("sector")} className={selectClass}>
          <option value="">All sectors</option>
          {SECTORS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select name="province" defaultValue={get("province")} className={selectClass}>
          <option value="">All provinces</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select name="buyerType" defaultValue={get("buyerType")} className={selectClass}>
          <option value="">All buyer types</option>
          {BUYER_TYPES.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>

        <select name="closingWithinDays" defaultValue={get("closingWithinDays")} className={selectClass}>
          <option value="">Any deadline</option>
          <option value="3">Closes in 3 days</option>
          <option value="7">Closes in 7 days</option>
          <option value="14">Closes in 14 days</option>
          <option value="30">Closes in 30 days</option>
        </select>

        <label htmlFor="minValue" className="sr-only">
          Minimum value (PKR)
        </label>
        <input
          id="minValue"
          name="minValue"
          type="number"
          min={0}
          step={1000000}
          defaultValue={get("minValue")}
          placeholder="Min PKR"
          className={selectClass}
        />

        <label htmlFor="maxValue" className="sr-only">
          Maximum value (PKR)
        </label>
        <input
          id="maxValue"
          name="maxValue"
          type="number"
          min={0}
          step={1000000}
          defaultValue={get("maxValue")}
          placeholder="Max PKR"
          className={selectClass}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <select
          name="sourcePortal"
          defaultValue={get("sourcePortal")}
          className={cn(selectClass, "max-w-xs")}
        >
          <option value="">All source portals</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Applying..." : "Apply filters"}
        </Button>
      </div>

      {alertOn && (
        <p className="rounded-lg bg-teal/10 px-3 py-2 text-xs text-teal2" role="status">
          Alerts on: we will notify you when new tenders match this search.
        </p>
      )}
    </form>
  );
}
