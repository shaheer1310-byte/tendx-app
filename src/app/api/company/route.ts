import { NextResponse } from "next/server";
import { z } from "zod";
import { getActiveCompany } from "@/server/tenant";
import { assertRole } from "@/server/auth-context";
import { toApiError } from "@/lib/api-errors";

/** GET /api/company (Build Spec section 8) -> the company profile. */
export async function GET() {
  return NextResponse.json({ company: await getActiveCompany() });
}

const patchSchema = z
  .object({
    legalName: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).optional(),
    province: z.string().trim().min(1).optional(),
    ppraRegistered: z.boolean().optional(),
    avgTurnoverPkr: z.number().nonnegative().optional(),
    categoryExperience: z.array(z.string().trim().min(1)).optional(),
    certifications: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

/**
 * PATCH /api/company -> update editable profile fields. Requires admin/owner
 * (the profile feeds eligibility and matching, Build Spec section 6.7).
 */
export async function PATCH(req: Request) {
  try {
    assertRole("admin");
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const company = await getActiveCompany();
    Object.assign(company, parsed.data);
    return NextResponse.json({ company });
  } catch (err) {
    return toApiError(err);
  }
}
