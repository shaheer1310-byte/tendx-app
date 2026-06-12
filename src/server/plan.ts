import { cookies } from "next/headers";
import type { Plan } from "./types";

/**
 * Plan gating (Build Spec section 10), enforced SERVER-SIDE.
 *
 * Resolution order:
 *  1. A `tendx_plan` cookie (demo affordance set by the Settings plan switcher).
 *  2. The demo default ("professional"), so every provisioned account sees the
 *     full demo. In production this reads the company's subscription row; real
 *     billing replaces the cookie (see docs/connectors.md).
 */
export const PLAN_COOKIE = "tendx_plan";

const PLANS: Plan[] = ["free", "professional", "enterprise"];

const DEFAULT_PLAN: Plan = "professional";

export function getPlan(): Plan {
  const value = cookies().get(PLAN_COOKIE)?.value;
  if (value && (PLANS as string[]).includes(value)) {
    return value as Plan;
  }
  return DEFAULT_PLAN;
}

/** Professional features: AI matching, analyzer, bid generation, profit analytics. */
export function isProfessional(): boolean {
  const plan = getPlan();
  return plan === "professional" || plan === "enterprise";
}

/** Enterprise features: team workspaces, public API access, integrations (§10). */
export function isEnterprise(): boolean {
  return getPlan() === "enterprise";
}

/** Thrown by server services when the current plan is too low for a feature. */
export class PlanRequiredError extends Error {
  constructor(
    message = "This feature requires the Professional plan.",
    /** The minimum plan the caller needs, for the API error payload. */
    readonly requiredPlan: Plan = "professional",
  ) {
    super(message);
    this.name = "PlanRequiredError";
  }
}

export function assertProfessional(): void {
  if (!isProfessional()) throw new PlanRequiredError();
}

export function assertEnterprise(): void {
  if (!isEnterprise()) {
    throw new PlanRequiredError(
      "This feature requires the Enterprise plan.",
      "enterprise",
    );
  }
}
