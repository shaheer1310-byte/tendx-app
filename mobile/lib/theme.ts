/**
 * TendX brand tokens (Build Spec section 4.1), mirrored for React Native.
 * Single source of colour for the mobile app, matching the web design system.
 */
export const colors = {
  navy: "#0A2540",
  navy2: "#0F3056",
  navy3: "#103A66",
  ink: "#0B1B2B",
  teal: "#12B5A5",
  teal2: "#0E9E90",
  mint: "#2BD9C0",
  gold: "#F5B82E",
  gold2: "#FFD36B",
  slate: "#64768A",
  line: "#E7EDF3",
  bg: "#F4F7FA",
  cloud: "#EAF1F8",
  white: "#FFFFFF",
  green: "#1FA971",
  red: "#E5484D",
} as const;

export const radius = { card: 16, pill: 999 } as const;

/** Demo user first name for the greeting (Build Spec section 11). */
export const DEMO_FIRST_NAME = "Ali";

/** Format a PKR amount, e.g. 24000000 -> "PKR 24.0M". Mirrors web lib/utils. */
export function formatPkr(valuePkr: number): string {
  if (valuePkr >= 1_000_000) return `PKR ${(valuePkr / 1_000_000).toFixed(1)}M`;
  if (valuePkr >= 1_000) return `PKR ${(valuePkr / 1_000).toFixed(0)}K`;
  return `PKR ${valuePkr.toLocaleString()}`;
}

/** Whole days from now until an ISO date (negative if past). */
export function daysUntil(iso: string): number {
  if (!iso) return 0;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

/** Colour for a match score, matching the web MatchScoreChip thresholds. */
export function matchColor(score: number): string {
  if (score >= 85) return colors.green;
  if (score >= 70) return colors.teal2;
  return colors.gold;
}
