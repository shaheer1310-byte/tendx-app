import { NextResponse } from "next/server";
import { z } from "zod";
import { importTender } from "@/server/tenders";

// Server-side validation on every API input (Build Spec section 13).
const importSchema = z
  .object({
    title: z.string().min(3),
    rawText: z.string().optional().default(""),
    rawUrl: z.string().url().optional().or(z.literal("")),
    buyer: z.string().optional(),
    sector: z.string().optional(),
    category: z.string().optional(),
    valuePkr: z.coerce.number().nonnegative().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    closesAt: z.string().optional(),
  })
  .refine((d) => d.rawText.trim().length > 0 || (d.rawUrl && d.rawUrl.length > 0), {
    message: "Provide tender text to paste or a URL to import.",
    path: ["rawText"],
  });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const tender = await importTender({
    title: data.title,
    rawText: data.rawText,
    rawUrl: data.rawUrl || undefined,
    buyer: data.buyer,
    sector: data.sector,
    category: data.category,
    valuePkr: data.valuePkr,
    city: data.city,
    province: data.province,
    closesAt: data.closesAt,
  });

  return NextResponse.json({ tender }, { status: 201 });
}
