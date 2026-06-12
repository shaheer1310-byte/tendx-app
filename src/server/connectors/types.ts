/**
 * Connector framework (Build Spec sections 3 scale-up path, and 12 Phase 4).
 *
 * DESIGN ONLY: these define the contract a real ingestion/integration service
 * will implement. Every connector here is `planned` and its `sync()` throws
 * `NotImplementedError` - no live network calls are made (Build Spec section 15
 * keeps real ingestion connectors out of scope until this phase builds them).
 */

export type ConnectorKind = "tender_portal" | "tax" | "payment";

export type ConnectorAuth =
  | "none"
  | "scraper" // public HTML, no auth
  | "api_key"
  | "oauth2"
  | "credentials"; // username/password or client cert

export type ConnectorStatus = "planned" | "beta" | "live";

/** Result a connector's sync run reports back to the ingestion queue. */
export interface IngestResult {
  fetched: number;
  imported: number;
  skipped: number;
  ranAt: string; // ISO timestamp
}

/** Serializable connector metadata (safe to send to the client). */
export interface ConnectorInfo {
  id: string;
  name: string;
  description: string;
  kind: ConnectorKind;
  authType: ConnectorAuth;
  status: ConnectorStatus;
  /** Province / scope, e.g. "Federal", "Punjab", "Pakistan". */
  region: string;
  /** What the connector ingests once built. */
  ingests: string;
  /** Planned schedule, e.g. "every 30 min", "daily 02:00 PKT". */
  cadence: string;
  docsUrl?: string;
}

/** A connector: metadata plus the (to-be-implemented) sync entry point. */
export interface Connector extends ConnectorInfo {
  sync(): Promise<IngestResult>;
}

/** Thrown by planned connectors; surfaced by the API as HTTP 501. */
export class NotImplementedError extends Error {
  constructor(connectorId: string) {
    super(`Connector "${connectorId}" is planned and not yet implemented.`);
    this.name = "NotImplementedError";
  }
}

/**
 * Build a `planned` connector from its metadata. The `sync()` deliberately
 * throws so the contract is exercised end to end without doing real ingestion.
 */
export function plannedConnector(meta: ConnectorInfo): Connector {
  return {
    ...meta,
    status: "planned",
    sync() {
      return Promise.reject(new NotImplementedError(meta.id));
    },
  };
}
