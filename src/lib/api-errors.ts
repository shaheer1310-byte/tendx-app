import { NextResponse } from "next/server";
import { PlanRequiredError } from "@/server/plan";
import { RoleRequiredError } from "@/server/auth-context";
import { TeamError } from "@/server/team";

/**
 * Map a known server error to a JSON response with the right status code.
 * Keeps plan/role gating (Build Spec section 10) consistent across routes.
 * Re-throws anything unexpected so Next surfaces a 500.
 */
export function toApiError(err: unknown): NextResponse {
  if (err instanceof PlanRequiredError) {
    return NextResponse.json(
      { error: err.message, requiredPlan: err.requiredPlan },
      { status: 403 },
    );
  }
  if (err instanceof RoleRequiredError) {
    return NextResponse.json(
      { error: err.message, requiredRole: err.requiredRole },
      { status: 403 },
    );
  }
  if (err instanceof TeamError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  throw err;
}
