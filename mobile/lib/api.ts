/**
 * Thin client for the shared TendX web API (Build Spec section 6.9). The mobile
 * app consumes the SAME endpoints as the web app (no separate backend):
 *   GET /api/tenders            -> { tenders: TenderWithMatch[] }
 *   GET /api/dashboard/summary  -> DashboardSummary
 *
 * Base URL comes from EXPO_PUBLIC_API_URL (see .env.example).
 */

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export interface TenderMatch {
  tenderId: string;
  score: number;
  explanation: string;
}

export interface Tender {
  id: string;
  refNo: string;
  title: string;
  buyer: string;
  sector: string;
  category: string;
  valuePkr: number;
  city: string;
  province: string;
  closesAt: string;
  match: TenderMatch;
}

export interface DashboardSummary {
  matchedTenders: number;
  matchedDelta: number;
  activeBids: number;
  deadlines7d: number;
  avgMatchScore: number;
  matchedList: Tender[];
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export function fetchDashboard(): Promise<DashboardSummary> {
  return getJson<DashboardSummary>("/api/dashboard/summary");
}

export async function fetchTenders(): Promise<Tender[]> {
  const data = await getJson<{ tenders: Tender[] }>("/api/tenders?sort=score");
  return data.tenders;
}
