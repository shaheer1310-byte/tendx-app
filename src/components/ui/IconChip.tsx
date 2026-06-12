import { cn } from "@/lib/utils";

/** Icon chip: small rounded square filled with cloud, teal icon (Build Spec 4.4). */
export function IconChip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cloud text-teal",
        className,
      )}
    >
      {children}
    </span>
  );
}
