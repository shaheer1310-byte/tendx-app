import { cookies } from "next/headers";
import { store } from "./store";
import type { Role, TeamMember } from "./types";

/**
 * Current-user / RBAC context (Build Spec sections 6.7 and 7.1), enforced
 * SERVER-SIDE alongside plan gating (server/plan.ts).
 *
 * Resolution order for "who am I acting as":
 *  1. A `tendx_user` cookie (demo affordance set by the Settings user switcher),
 *     so role-based access can be exercised without a full auth flow.
 *  2. The workspace owner.
 * In production this comes from the Auth.js session (the JWT carries the role).
 */
export const USER_COOKIE = "tendx_user";

/** Role privilege order; higher index = more privilege. */
const ROLE_RANK: Record<Role, number> = { member: 0, admin: 1, owner: 2 };

export function getCurrentUser(): TeamMember {
  const id = cookies().get(USER_COOKIE)?.value;
  const active = store.users.filter((u) => u.status === "active");
  const byId = id && active.find((u) => u.id === id);
  if (byId) return byId;
  return (
    active.find((u) => u.role === "owner") ?? active[0] ?? store.users[0]
  );
}

export function getRole(): Role {
  return getCurrentUser().role;
}

/** True when the current user's role meets or exceeds `min`. */
export function hasRole(min: Role): boolean {
  return ROLE_RANK[getRole()] >= ROLE_RANK[min];
}

/** Thrown when the current user's role is insufficient for an action. */
export class RoleRequiredError extends Error {
  constructor(
    readonly requiredRole: Role,
    message = `This action requires the ${requiredRole} role or higher.`,
  ) {
    super(message);
    this.name = "RoleRequiredError";
  }
}

export function assertRole(min: Role): void {
  if (!hasRole(min)) throw new RoleRequiredError(min);
}
