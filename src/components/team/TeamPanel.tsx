"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Shield, Trash2, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { Role, TeamMember } from "@/server/types";

const roleStyles: Record<Role, string> = {
  owner: "bg-gold/15 text-gold2",
  admin: "bg-teal/10 text-teal2",
  member: "bg-cloud text-slate",
};

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
        roleStyles[role],
      )}
    >
      {role === "owner" && <Crown className="h-3 w-3" aria-hidden />}
      {role === "admin" && <Shield className="h-3 w-3" aria-hidden />}
      {role}
    </span>
  );
}

const selectClass =
  "h-9 rounded-xl border border-line bg-white px-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal";

/**
 * Team workspace management (Build Spec sections 6.7, 7.1). RBAC is enforced
 * server-side; this UI only enables the controls when the acting user can
 * manage (admin or owner). The "acting as" switcher demonstrates the gating.
 */
export function TeamPanel({
  members,
  currentUserId,
  canManage,
}: {
  members: TeamMember[];
  currentUserId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeUsers = members.filter((m) => m.status === "active");

  async function call(input: RequestInit & { url: string }) {
    setBusy(true);
    setError(null);
    const { url, ...init } = input;
    const res = await fetch(url, init);
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Something went wrong.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const ok = await call({
      url: "/api/team",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role }),
    });
    if (ok) {
      setName("");
      setEmail("");
      setRole("member");
    }
  }

  function changeRole(id: string, next: string) {
    void call({
      url: `/api/team/${id}`,
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    });
  }

  function remove(id: string) {
    void call({ url: `/api/team/${id}`, method: "DELETE" });
  }

  function switchUser(id: string) {
    void call({
      url: "/api/acting-user",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
  }

  return (
    <div className="space-y-5">
      {/* Acting-as switcher (demo affordance for server-side RBAC) */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-cloud px-3.5 py-3">
        <span className="text-sm font-medium text-ink">Acting as</span>
        <select
          value={currentUserId}
          onChange={(e) => switchUser(e.target.value)}
          className={selectClass}
          aria-label="Acting as user"
        >
          {activeUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role})
            </option>
          ))}
        </select>
        <span className="text-xs text-slate">
          {canManage
            ? "You can manage the team."
            : "Members have read-only access; switch to an admin or owner to manage."}
        </span>
      </div>

      {error && (
        <p className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red" role="alert">
          {error}
        </p>
      )}

      {/* Member list */}
      <ul className="divide-y divide-line rounded-card border border-line">
        {members.map((m) => {
          const isOwner = m.role === "owner";
          const isSelf = m.id === currentUserId;
          return (
            <li
              key={m.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-xs font-bold text-white">
                {m.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {m.name}
                  {isSelf && <span className="ml-1 text-xs text-slate">(you)</span>}
                </p>
                <p className="truncate text-xs text-slate">{m.email}</p>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {m.status === "invited" && (
                  <span className="label-caps rounded-full bg-gold/15 px-2 py-0.5 text-gold2">
                    Invited
                  </span>
                )}
                {canManage && !isOwner ? (
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(m.id, e.target.value)}
                    disabled={busy}
                    className={selectClass}
                    aria-label={`Role for ${m.name}`}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                ) : (
                  <RoleBadge role={m.role} />
                )}
                {canManage && !isOwner && !isSelf && (
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    disabled={busy}
                    aria-label={`Remove ${m.name}`}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-line text-slate transition hover:border-red/40 hover:text-red disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Invite form (admin/owner only) */}
      {canManage && (
        <form
          onSubmit={invite}
          className="grid grid-cols-1 gap-3 rounded-card border border-line p-4 sm:grid-cols-[1fr_1fr_auto_auto]"
        >
          <div>
            <Label htmlFor="invite-name">Name</Label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
          </div>
          <div>
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.pk"
              required
            />
          </div>
          <div>
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "member")}
              className={cn(selectClass, "h-11 w-full")}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={busy} className="w-full">
              <UserPlus className="h-4 w-4" aria-hidden />
              Invite
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
