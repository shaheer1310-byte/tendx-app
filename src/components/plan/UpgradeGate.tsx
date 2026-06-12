import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

/**
 * Shown in place of a Professional feature when the current plan is Free
 * (Build Spec section 10). The block is also enforced server-side on the API.
 */
export function UpgradeGate({
  feature,
  description,
  plan = "professional",
}: {
  feature: string;
  description: string;
  plan?: "professional" | "enterprise";
}) {
  const label = plan === "enterprise" ? "Enterprise" : "Professional";
  const price =
    plan === "enterprise" ? "PKR 25,000+ / month" : "PKR 10,000 / month";

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="flex flex-col items-center gap-4 px-8 py-14 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-cloud text-teal">
          <Lock className="h-6 w-6" aria-hidden />
        </span>
        <div className="space-y-1.5">
          <h2 className="font-display text-lg font-bold text-ink">
            {feature} is {plan === "enterprise" ? "an" : "a"} {label} feature
          </h2>
          <p className="text-sm text-slate">{description}</p>
        </div>
        <span className="label-caps rounded-full bg-cloud px-3 py-1 text-teal2">
          {label} - {price}
        </span>
        <Link href="/settings">
          <Button>Upgrade to {label}</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
