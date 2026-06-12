import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

/** Centered card on the brand background for the unauthenticated auth screens. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden flex-col justify-between bg-navy-hero p-10 text-white lg:flex">
        <Link href="/" aria-label="TendX home">
          <Logo size={36} onDark />
        </Link>
        <div>
          <h2 className="max-w-md text-balance font-display text-3xl font-bold leading-tight">
            From Tender Discovery to{" "}
            <span className="text-gold">Contract Success</span>.
          </h2>
          <p className="mt-4 max-w-sm text-white/70">
            Win more government, military and institutional tenders with AI
            matching, compliant bid generation and profit analytics.
          </p>
        </div>
        <p className="label-caps text-mint">
          Tender · Procurement · Compliance AI
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-bg p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" aria-label="TendX home">
              <Logo size={32} />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
