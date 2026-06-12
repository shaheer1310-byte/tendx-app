import { cn } from "@/lib/utils";

/**
 * Match-score chip (Build Spec section 4.4):
 *  - high   (>= 85%) green on light-green
 *  - medium (70-84%) gold/brown on light-gold
 *  - low    (< 70%)  slate on light
 */
export function MatchScoreChip({
  score,
  className,
  size = "md",
}: {
  score: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const tier =
    score >= 85
      ? "bg-green/12 text-green"
      : score >= 70
        ? "bg-gold/20 text-ink"
        : "bg-cloud text-slate";

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full font-display font-bold",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        tier,
        className,
      )}
    >
      {score}% match
    </span>
  );
}
