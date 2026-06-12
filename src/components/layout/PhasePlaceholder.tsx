import { Card, CardContent } from "@/components/ui/Card";
import { Sparkles } from "lucide-react";

/**
 * Phase 0 placeholder body for routes whose features land in later phases.
 * Keeps the brand and shell intact while the underlying module is built.
 */
export function PhasePlaceholder({
  phase,
  children,
}: {
  phase: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="flex flex-col items-center gap-4 px-8 py-14 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-cloud text-teal">
          <Sparkles className="h-6 w-6" aria-hidden />
        </span>
        <div className="space-y-2">{children}</div>
        <span className="label-caps rounded-full bg-cloud px-3 py-1 text-teal2">
          {phase}
        </span>
      </CardContent>
    </Card>
  );
}
