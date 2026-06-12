import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { auth } from "@/lib/auth";

/**
 * Authenticated app shell (Build Spec section 5): navy sidebar + top bar +
 * content area. In Phase 0 the routes are openly viewable so the shell can be
 * previewed; server-side route gating arrives in Phase 1 once the database is
 * migrated and seeded.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth().catch(() => null);
  const userName = session?.user?.name ?? "Ali Hassan";

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar userName={userName} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
