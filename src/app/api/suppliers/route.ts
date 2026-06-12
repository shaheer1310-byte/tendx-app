import { NextResponse } from "next/server";
import { z } from "zod";
import { searchSuppliers } from "@/server/suppliers";

const schema = z.object({
  keyword: z.string().trim().optional(),
  category: z.string().trim().optional(),
  origin: z.enum(["local", "import"]).optional(),
});

/**
 * GET /api/suppliers?keyword=&category=&origin=
 * Supplier search / cost comparison (Build Spec section 6.5). Open across plans
 * (discovery-style); the margin-impact planner is the Professional feature.
 */
export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = schema.safeParse({
    keyword: searchParams.get("keyword") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    origin: searchParams.get("origin") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  return NextResponse.json({ offers: searchSuppliers(parsed.data) });
}
