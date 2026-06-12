import { Bell, Search } from "lucide-react";

/**
 * Authenticated top bar (Build Spec section 5): global search, a notifications
 * bell with an unread dot, and a user avatar (initials).
 */
export function Topbar({
  userName = "Ali Hassan",
}: {
  userName?: string;
}) {
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line bg-white px-6">
      <div className="relative max-w-md flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
          aria-hidden
        />
        <label htmlFor="global-search" className="sr-only">
          Search
        </label>
        <input
          id="global-search"
          type="search"
          placeholder="Search tenders, suppliers, categories..."
          className="h-10 w-full rounded-xl border border-line bg-bg pl-9 pr-3 text-sm text-ink placeholder:text-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-slate transition hover:bg-cloud"
        >
          <Bell className="h-[18px] w-[18px]" aria-hidden />
          <span
            className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red ring-2 ring-white"
            aria-hidden
          />
        </button>

        <div
          className="grid h-10 w-10 place-items-center rounded-full bg-navy font-display text-sm font-bold text-white"
          aria-label={userName}
          title={userName}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
