import { createHash, randomBytes, randomUUID } from "crypto";
import { ensureCompany, store } from "./store";
import { getActiveCompanyId } from "./tenant";
import type { ApiKey, ApiKeyPublic, CompanyProfile } from "./types";

const TOKEN_PREFIX = "tendx_live_";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

function toPublic(key: ApiKey): ApiKeyPublic {
  return {
    id: key.id,
    name: key.name,
    masked: `${key.prefix}…${key.lastFour}`,
    createdAt: key.createdAt,
    lastUsedAt: key.lastUsedAt,
    revoked: Boolean(key.revokedAt),
  };
}

/** All keys for the workspace, newest first (masked, never the raw token). */
export function listKeys(): ApiKeyPublic[] {
  return [...store.apiKeys]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toPublic);
}

/**
 * Issue a new key. The raw token is returned ONCE and never stored (only its
 * SHA-256 hash is kept). Callers must surface it to the user immediately.
 */
export async function issueKey(
  name: string,
): Promise<{ key: ApiKeyPublic; token: string }> {
  const companyId = await getActiveCompanyId();
  const token = `${TOKEN_PREFIX}${randomBytes(20).toString("hex")}`;
  const key: ApiKey = {
    id: randomUUID(),
    companyId,
    name: name.trim() || "Untitled key",
    prefix: token.slice(0, 15),
    lastFour: token.slice(-4),
    tokenHash: sha256(token),
    createdAt: new Date().toISOString().slice(0, 10),
  };
  store.apiKeys.push(key);
  return { key: toPublic(key), token };
}

/** Revoke a key by id. Returns false if not found. */
export function revokeKey(id: string): boolean {
  const key = store.apiKeys.find((k) => k.id === id);
  if (!key) return false;
  key.revokedAt = new Date().toISOString();
  return true;
}

/**
 * Authenticate a raw bearer token against the stored hashes. Returns the
 * company on success (and stamps lastUsedAt), or null. In production keys map
 * to a company row; here every key belongs to the single demo workspace.
 */
export function authenticateApiKey(token: string | null): CompanyProfile | null {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;
  const hash = sha256(token);
  const key = store.apiKeys.find((k) => k.tokenHash === hash && !k.revokedAt);
  if (!key) return null;
  key.lastUsedAt = new Date().toISOString().slice(0, 10);
  return ensureCompany(key.companyId);
}
