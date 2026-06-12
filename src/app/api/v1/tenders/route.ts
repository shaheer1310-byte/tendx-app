import { NextResponse } from "next/server";
import { z } from "zod";
import { guardPublicApi } from "@/lib/public-api";
import { listTenders } from "@/server/tenders";
import type { BuyerType, TenderFilters } from "@/server/types";

const buyerTypes = ["federal", "provincial", "military", "soe", "private"] as const;

const querySchema = z.object({
  keyword: z.string().optional(),
  sector: z.string().optional(),
  province: z.string().optional(),
  buyerType: z.enum(buyerTypes).optional(),
  sort: z.enum(["score", "deadline", "value", "recency"]).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

/**
 * GET /api/v1/tenders -> paginated tenders for the authenticated company.
 * Public API (Enterprise, Build Spec sections 8 and 10): requires an API key
 * and is rate limited per key.
 */
export async function GET(req: Request) {
  const guard = guardPublicApi(req);
  if ("error" in guard) return guard.error;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { limit, offset, ...rest } = parsed.data;
  const filters: TenderFilters = {
    ...rest,
    buyerType: rest.buyerType as BuyerType | undefined,
  };
  const all = await listTenders(filters);
  const page = all.slice(offset, offset + limit);

  return NextResponse.json(
    { data: page, pagination: { total: all.length, limit, offset } },
    { headers: guard.headers },
  );
}
