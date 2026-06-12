import { NextResponse } from "next/server";
import { z } from "zod";
import { listTenders } from "@/server/tenders";
import type { BuyerType, TenderFilters } from "@/server/types";

const buyerTypes = ["federal", "provincial", "military", "soe", "private"] as const;

const querySchema = z.object({
  keyword: z.string().optional(),
  sector: z.string().optional(),
  province: z.string().optional(),
  buyerType: z.enum(buyerTypes).optional(),
  minValue: z.coerce.number().nonnegative().optional(),
  maxValue: z.coerce.number().nonnegative().optional(),
  closingWithinDays: z.coerce.number().int().positive().optional(),
  sourcePortal: z.string().optional(),
  sort: z.enum(["score", "deadline", "value", "recency"]).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid filters.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const filters: TenderFilters = {
    ...parsed.data,
    buyerType: parsed.data.buyerType as BuyerType | undefined,
  };
  return NextResponse.json({ tenders: await listTenders(filters) });
}
