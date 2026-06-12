import { NextResponse } from "next/server";
import { z } from "zod";
import { isProfessional } from "@/server/plan";
import { estimate } from "@/server/tax";

const schema = z.object({
  contractValuePkr: z.coerce.number().nonnegative(),
  procurementCostPkr: z.coerce.number().nonnegative(),
  logisticsOverheadsPkr: z.coerce.number().nonnegative().default(0),
  gst: z.boolean().default(true),
  sst: z.boolean().default(false),
  withholding: z.boolean().default(true),
  duties: z.boolean().default(false),
});

export async function POST(req: Request) {
  // Profit analytics are a Professional feature (Build Spec section 10).
  if (!isProfessional()) {
    return NextResponse.json(
      { error: "Profit analytics require the Professional plan." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  return NextResponse.json(estimate(parsed.data));
}
