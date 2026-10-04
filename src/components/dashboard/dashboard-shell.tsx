import type { SessionUser } from "@/lib/auth/session";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function DashboardShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted">
      <Sidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 px-4 py-8 md:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
