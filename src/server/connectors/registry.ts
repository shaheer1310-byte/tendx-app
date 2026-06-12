import { plannedConnector } from "./types";
import type { Connector, ConnectorInfo } from "./types";

/**
 * The connector catalogue (Build Spec section 12 Phase 4): EPADS/PPRA, the
 * provincial procurement portals, FBR tax data, and payment gateways. All are
 * `planned` - this is the design surface, not a live integration.
 */
export const connectors: Connector[] = [
  // --- Tender portals ---
  plannedConnector({
    id: "epads",
    name: "EPADS (e-Pak Acquisition & Disposal System)",
    description:
      "Federal e-procurement system that digitises the buyer side; primary source for federal tender notices and award data.",
    kind: "tender_portal",
    authType: "credentials",
    status: "planned",
    region: "Federal",
    ingests: "Tender notices, corrigenda, award results",
    cadence: "every 30 min",
  }),
  plannedConnector({
    id: "ppra-federal",
    name: "PPRA Federal",
    description:
      "Public Procurement Regulatory Authority federal portal listings, including tender documents and BOQs.",
    kind: "tender_portal",
    authType: "scraper",
    status: "planned",
    region: "Federal",
    ingests: "Tender notices, attachments (BOQ PDFs)",
    cadence: "every 30 min",
  }),
  plannedConnector({
    id: "ppms-punjab",
    name: "Punjab PPRA (PPMS)",
    description:
      "Punjab Procurement Management System notices across provincial departments.",
    kind: "tender_portal",
    authType: "scraper",
    status: "planned",
    region: "Punjab",
    ingests: "Tender notices, attachments",
    cadence: "hourly",
  }),
  plannedConnector({
    id: "sppra-sindh",
    name: "Sindh SPPRA",
    description: "Sindh Public Procurement Regulatory Authority tender portal.",
    kind: "tender_portal",
    authType: "scraper",
    status: "planned",
    region: "Sindh",
    ingests: "Tender notices, attachments",
    cadence: "hourly",
  }),
  plannedConnector({
    id: "kppra-kpk",
    name: "KPK PPRA (KPPRA)",
    description:
      "Khyber Pakhtunkhwa Public Procurement Regulatory Authority listings.",
    kind: "tender_portal",
    authType: "scraper",
    status: "planned",
    region: "Khyber Pakhtunkhwa",
    ingests: "Tender notices, attachments",
    cadence: "hourly",
  }),
  plannedConnector({
    id: "bppra-balochistan",
    name: "Balochistan PPRA (BPPRA)",
    description:
      "Balochistan Public Procurement Regulatory Authority tender portal.",
    kind: "tender_portal",
    authType: "scraper",
    status: "planned",
    region: "Balochistan",
    ingests: "Tender notices, attachments",
    cadence: "daily 02:00 PKT",
  }),

  // --- Tax data ---
  plannedConnector({
    id: "fbr-iris",
    name: "FBR (IRIS)",
    description:
      "Federal Board of Revenue: NTN/STRN verification, active-taxpayer status and current GST/withholding rates feeding the deterministic tax calculator.",
    kind: "tax",
    authType: "api_key",
    status: "planned",
    region: "Pakistan",
    ingests: "Taxpayer verification, tax-rate tables",
    cadence: "daily + on demand",
  }),

  // --- Payment gateways ---
  plannedConnector({
    id: "payfast-1link",
    name: "PayFast (1LINK)",
    description:
      "Card and bank-rail payments for subscription billing across the 1LINK network.",
    kind: "payment",
    authType: "api_key",
    status: "planned",
    region: "Pakistan",
    ingests: "Subscription charges, webhooks (success/refund/chargeback)",
    cadence: "real-time webhooks",
  }),
  plannedConnector({
    id: "easypaisa",
    name: "Easypaisa",
    description: "Mobile-wallet payments for Professional/Enterprise billing.",
    kind: "payment",
    authType: "api_key",
    status: "planned",
    region: "Pakistan",
    ingests: "Wallet charges, payment webhooks",
    cadence: "real-time webhooks",
  }),
  plannedConnector({
    id: "jazzcash",
    name: "JazzCash",
    description: "Mobile-wallet and card payments for subscription billing.",
    kind: "payment",
    authType: "api_key",
    status: "planned",
    region: "Pakistan",
    ingests: "Wallet/card charges, payment webhooks",
    cadence: "real-time webhooks",
  }),
];

/** Strip the `sync` function for safe serialization to the client. */
export function listConnectorInfos(): ConnectorInfo[] {
  return connectors.map(({ sync: _sync, ...info }) => info);
}

export function getConnector(id: string): Connector | undefined {
  return connectors.find((c) => c.id === id);
}
