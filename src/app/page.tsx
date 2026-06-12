import Link from "next/link";
import {
  ListFilter,
  Sparkles,
  FileText,
  Store,
  Calculator,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

interface Module {
  title: string;
  description: string;
  icon: LucideIcon;
}

// The five product modules (Build Spec section 2).
const MODULES: Module[] = [
  {
    title: "Tender Intelligence Engine",
    description:
      "Aggregate tenders from 14+ portals into one searchable feed with filters, deadline tracking and alerts.",
    icon: ListFilter,
  },
  {
    title: "AI Tender Analyzer",
    description:
      "Extract requirements, run an eligibility check against your profile and get a match score with recommended actions.",
    icon: Sparkles,
  },
  {
    title: "Bid Generation System",
    description:
      "Draft the full bid pack: cover letter, technical proposal, financial BOQ and a compliance checklist.",
    icon: FileText,
  },
  {
    title: "Procurement Intelligence",
    description:
      "Discover suppliers, compare input costs and find cheaper sourcing to protect your margin.",
    icon: Store,
  },
  {
    title: "Tax and Compliance",
    description:
      "Auto-calculate GST, SST, withholding tax and duties to see net profit before you commit to a bid.",
    icon: Calculator,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <header className="bg-navy-hero text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Logo size={36} onDark />
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-white/80 transition hover:text-white"
            >
              Log in
            </Link>
            <Link href="/signup">
              <Button variant="gold" size="sm">
                Get started
              </Button>
            </Link>
          </nav>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-24 pt-12 text-center">
          <span className="label-caps text-mint">
            Tender · Procurement · Compliance AI
          </span>
          <h1 className="mx-auto mt-4 max-w-3xl text-balance font-display text-5xl font-extrabold leading-[1.05] tracking-tight">
            From Tender Discovery to{" "}
            <span className="text-gold">Contract Success</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-white/75">
            AI-Powered Tender, Procurement and Compliance Intelligence for
            Pakistani suppliers. Decide what to bid on, prepare compliant bids
            and price profitably.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/signup">
              <Button variant="gold" size="lg">
                Start free
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                className="border border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                Log in
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/60">
            200,000+ tenders published in Pakistan each year across fragmented
            portals. Stop missing the ones you can win.
          </p>
        </div>
      </header>

      {/* Modules */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
            The intelligence layer for the supplier side
          </h2>
          <p className="mt-3 text-slate">
            Five modules that take you from discovery to a submitted,
            profitable bid.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="rounded-card border border-line bg-white p-6 shadow-card"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-cloud text-teal">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-ink">
                  {m.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">
                  {m.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Logo size={28} />
          <p className="text-sm text-slate">
            © {new Date().getFullYear()} TendX. Built for Pakistani suppliers.
          </p>
        </div>
      </footer>
    </div>
  );
}
