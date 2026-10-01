import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Super Admin overview" };

const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });

export default async function SuperAdminOverview() {
  const user = await requireRole("SUPER_ADMIN");

  const [admins, teachers, recent] = await Promise.all([
    db.user.count({ where: { role: "ADMIN", status: "ACTIVE" } }),
    db.user.count({ where: { role: "TEACHER", status: "ACTIVE" } }),
    db.auditLog.findMany({
      where: { action: { not: "LOGIN_FAILED" } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, action: true, actorRole: true, createdAt: true },
    }),
  ]);

  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(" ")[0]}`} description="System-level overview and recent activity." />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Active admins" value={admins} />
        <StatCard label="Active teachers" value={teachers} />
      </div>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>The latest recorded actions. The full audit log arrives in Phase 10.</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="font-medium">{r.action.replaceAll("_", " ").toLowerCase()}</span>
                  <span className="text-muted-foreground">
                    {r.actorRole ? `${r.actorRole.replace("_", " ").toLowerCase()} · ` : ""}
                    {when.format(r.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
