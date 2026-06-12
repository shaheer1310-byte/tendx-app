/** Page title + subline used across app screens (Build Spec section 4.2). */
export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[25px] font-bold tracking-tight text-ink">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-slate">{subtitle}</p>}
    </div>
  );
}
