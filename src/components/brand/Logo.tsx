import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * TendX logo (Build Spec section 4.3).
 * The mark is a navy rounded-square badge with a two-tone "X": a teal stroke
 * crossed by a gold growth-arrow, plus a mint "AI spark" dot. The wordmark is
 * "TendX" with the X in gold. Pass `showSubtitle` for the full lockup.
 */

export function LogoMark({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  // Stable, per-instance gradient ids: useId() is consistent across server and
  // client render (no hydration mismatch) and unique so multiple marks on a
  // page do not collide.
  const uid = useId();
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="TendX logo mark"
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0A2540" />
          <stop offset="1" stopColor="#103A66" />
        </linearGradient>
        <linearGradient id={`${uid}-t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2BD9C0" />
          <stop offset="1" stopColor="#12B5A5" />
        </linearGradient>
        <linearGradient id={`${uid}-g`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#F5B82E" />
          <stop offset="1" stopColor="#FFD36B" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="512" height="512" rx="120" fill={`url(#${uid}-bg)`} />
      <line
        x1="168"
        y1="160"
        x2="344"
        y2="352"
        stroke={`url(#${uid}-t)`}
        strokeWidth="62"
        strokeLinecap="round"
      />
      <line
        x1="168"
        y1="352"
        x2="330"
        y2="186"
        stroke={`url(#${uid}-g)`}
        strokeWidth="62"
        strokeLinecap="round"
      />
      <path
        d="M306 150 L378 142 L362 212 Z"
        fill={`url(#${uid}-g)`}
        stroke={`url(#${uid}-g)`}
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <circle cx="384" cy="356" r="15" fill="#2BD9C0" />
      <circle
        cx="384"
        cy="356"
        r="30"
        fill="none"
        stroke="#2BD9C0"
        strokeWidth="6"
        opacity="0.45"
      />
    </svg>
  );
}

export function Logo({
  className,
  size = 36,
  showSubtitle = false,
  onDark = false,
}: {
  className?: string;
  size?: number;
  showSubtitle?: boolean;
  onDark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={size} />
      <div className="leading-tight">
        <div
          className={cn(
            "font-display font-extrabold tracking-tight",
            onDark ? "text-white" : "text-navy",
          )}
          style={{ fontSize: size * 0.55 }}
        >
          Tend<span className="text-gold">X</span>
        </div>
        {showSubtitle && (
          <div
            className={cn(
              "label-caps mt-0.5",
              onDark ? "text-mint" : "text-slate",
            )}
          >
            Tender · Procurement · Compliance AI
          </div>
        )}
      </div>
    </div>
  );
}
