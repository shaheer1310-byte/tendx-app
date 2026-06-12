import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

/**
 * Company-profile onboarding (Build Spec section 6.8).
 * Phase 0 stub: the multi-step form that captures NTN, GST, PPRA status,
 * turnover, certifications and category experience is built in Phase 1.
 */
export default function OnboardingPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg p-6">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <Logo size={34} />
        </div>
        <Card>
          <CardContent className="space-y-4 px-8 py-10 text-center">
            <span className="label-caps text-teal2">Step 1 of 1</span>
            <h1 className="font-display text-2xl font-bold text-ink">
              Set up your company profile
            </h1>
            <p className="text-sm leading-relaxed text-slate">
              Next we will capture your legal name, NTN, GST and PPRA/EPADS
              registration, turnover by year, certifications and category
              experience. This profile powers eligibility checks and tender
              matching from day one. The full multi-step form arrives in Phase 1.
            </p>
            <Link href="/dashboard" className="block pt-2">
              <Button className="w-full">Continue to dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
