import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// Any signed-in user can open this area (it must be reachable while a temporary password is still active).
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
