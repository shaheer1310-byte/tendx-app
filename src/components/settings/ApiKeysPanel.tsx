"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Copy, Check, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import type { ApiKeyPublic } from "@/server/types";

/**
 * API access management (Build Spec sections 8, 10; Enterprise). Keys are
 * issued, listed (masked) and revoked here; the raw token is shown exactly once.
 */
export function ApiKeysPanel({
  keys,
  canManage,
}: {
  keys: ApiKeyPublic[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNewToken(null);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setBusy(false);
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      setError(b.error ?? "Could not create the key.");
      return;
    }
    const b = (await res.json()) as { token: string };
    setNewToken(b.token);
    setName("");
    router.refresh();
  }

  async function revoke(id: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError("Could not revoke the key.");
      return;
    }
    router.refresh();
  }

  async function copy() {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate">
        Authenticate requests to the public API (<code className="text-ink">/api/v1/*</code>)
        with these keys. Pass the token as{" "}
        <code className="text-ink">Authorization: Bearer &lt;token&gt;</code>.
      </p>

      {error && (
        <p className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red" role="alert">
          {error}
        </p>
      )}

      {/* One-time token reveal */}
      {newToken && (
        <div className="rounded-card border border-teal/40 bg-teal/5 p-4">
          <p className="text-sm font-semibold text-ink">
            Copy your new key now - it will not be shown again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-2 text-sm text-ink ring-1 ring-line">
              {newToken}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      )}

      {/* Key list */}
      <ul className="divide-y divide-line rounded-card border border-line">
        {keys.length === 0 && (
          <li className="px-4 py-4 text-sm text-slate">No API keys yet.</li>
        )}
        {keys.map((k) => (
          <li key={k.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-cloud text-teal">
              <KeyRound className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {k.name}
                {k.revoked && (
                  <span className="ml-2 rounded-full bg-red/10 px-2 py-0.5 text-xs font-semibold text-red">
                    Revoked
                  </span>
                )}
              </p>
              <p className="font-mono text-xs text-slate">{k.masked}</p>
            </div>
            <div className="ml-auto flex items-center gap-3 text-xs text-slate">
              <span>Created {k.createdAt}</span>
              <span>{k.lastUsedAt ? `Used ${k.lastUsedAt}` : "Never used"}</span>
              {canManage && !k.revoked && (
                <button
                  type="button"
                  onClick={() => revoke(k.id)}
                  disabled={busy}
                  aria-label={`Revoke ${k.name}`}
                  className="grid h-8 w-8 place-items-center rounded-xl border border-line text-slate transition hover:border-red/40 hover:text-red disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Create form */}
      {canManage ? (
        <form
          onSubmit={create}
          className="grid grid-cols-1 gap-3 rounded-card border border-line p-4 sm:grid-cols-[1fr_auto]"
        >
          <div>
            <Label htmlFor="key-name">New key name</Label>
            <Input
              id="key-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ERP integration"
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={busy} className="w-full">
              <Plus className="h-4 w-4" aria-hidden />
              Create key
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-slate">
          Switch to an admin or owner to create or revoke keys.
        </p>
      )}
    </div>
  );
}
