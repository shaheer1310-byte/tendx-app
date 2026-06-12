import { randomUUID } from "crypto";
import { assertRole, getCurrentUser } from "./auth-context";
import { store } from "./store";
import { demoCompany } from "./data/fixtures";
import type { Role, TeamMember } from "./types";

/** All members of the current workspace, owners first. */
export function listMembers(): TeamMember[] {
  const rank: Record<Role, number> = { owner: 0, admin: 1, member: 2 };
  return [...store.users].sort(
    (a, b) => rank[a.role] - rank[b.role] || a.name.localeCompare(b.name),
  );
}

/** Thrown for invalid team mutations (duplicate email, last owner, etc.). */
export class TeamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TeamError";
  }
}

/** Invite a new member by email. Requires admin or owner. */
export function inviteMember(input: {
  name: string;
  email: string;
  role: Exclude<Role, "owner">;
}): TeamMember {
  assertRole("admin");
  const email = input.email.trim().toLowerCase();
  if (store.users.some((u) => u.email.toLowerCase() === email)) {
    throw new TeamError("A member with that email already exists.");
  }
  const member: TeamMember = {
    id: randomUUID(),
    companyId: demoCompany.id,
    name: input.name.trim(),
    email,
    role: input.role,
    status: "invited",
    joinedAt: new Date().toISOString().slice(0, 10),
  };
  store.users.push(member);
  return member;
}

/** Change a member's role. Requires admin or owner; the owner is protected. */
export function updateRole(id: string, role: Role): TeamMember {
  assertRole("admin");
  const member = store.users.find((u) => u.id === id);
  if (!member) throw new TeamError("Member not found.");
  if (member.role === "owner") {
    throw new TeamError("The workspace owner's role cannot be changed.");
  }
  if (role === "owner") {
    // Transferring ownership is a dedicated flow; not exposed here.
    throw new TeamError("Use ownership transfer to assign the owner role.");
  }
  member.role = role;
  return member;
}

/** Remove a member. Requires admin or owner; cannot remove the owner or self. */
export function removeMember(id: string): void {
  assertRole("admin");
  const member = store.users.find((u) => u.id === id);
  if (!member) throw new TeamError("Member not found.");
  if (member.role === "owner") {
    throw new TeamError("The workspace owner cannot be removed.");
  }
  if (member.id === getCurrentUser().id) {
    throw new TeamError("You cannot remove yourself.");
  }
  store.users = store.users.filter((u) => u.id !== id);
}
