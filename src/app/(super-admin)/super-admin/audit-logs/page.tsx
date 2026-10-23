import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma, Role } from "@prisma/client";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/db";
import { AuditAction } from "@/lib/audit";
import { formatDateTime } from "@/lib/format";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Audit log" };

const PAGE_SIZE = 50;
const ACTIONS = Object.values(AuditAction).sort();
const nice = (s: string) => s.replaceAll("_", " ").toLowerCase();

const compact = (m: unknown) => {
  if (!m || typeof m !== "object") return "";
  return Object.entries(m as Record<string, unknown>).filter(([, v]) => v !== null && v !== "").map(([k, v]) => `${k}: ${String(v)}`).join(" · ").slice(0, 160);
};

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<{ action?: string; role?: string; page?: string; hideLogins?: string }> }) {
  await requireRole("SUPER_ADMIN");
  const sp = await searchParams;
  const action = ACTIONS.find((a) => a === sp.action);
  const role = (["SUPER_ADMIN", "ADMIN", "TEACHER"] as const).find((r) => r === sp.role) as Role | undefined;
  const hideLogins = sp.hideLogins !== "0";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action } : hideLogins ? { action: { notIn: ["LOGIN_FAILED", "LOGIN_SUCCEEDED", "LOGOUT"] } } : {}),
    ...(role ? { actorRole: role } : {}),
  };
  const [total, logs] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);
  const people = await db.user.findMany({ where: { id: { in: [...new Set(logs.map((l) => l.actorId).filter((x): x is string => Boolean(x)))] } }, select: { id: true, name: true } });
  const nameOf = new Map(people.map((p) => [p.id, p.name]));
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => `/super-admin/audit-logs?${new URLSearchParams({ ...(action ? { action } : {}), ...(role ? { role } : {}), ...(hideLogins ? {} : { hideLogins: "0" }), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Audit log" description="A permanent record of important actions: who did what, and when. Entries cannot be edited or deleted from the website." />
      <form method="get" className="mb-6 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm">Action<Select name="action" defaultValue={action ?? ""} className="min-w-64"><option value="">All actions</option>{ACTIONS.map((a) => <option key={a} value={a}>{nice(a)}</option>)}</Select></label>
        <label className="flex flex-col gap-1 text-sm">Done by<Select name="role" defaultValue={role ?? ""}><option value="">Anyone</option><option value="SUPER_ADMIN">Super Admin</option><option value="ADMIN">Admin</option><option value="TEACHER">Teacher</option></Select></label>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name="hideLogins" value="0" defaultChecked={!hideLogins} className="size-4" />Show sign-ins</label>
        <button type="submit" className="h-10 rounded-lg border border-input px-4 text-sm hover:bg-primary-soft">Filter</button>
      </form>

      {logs.length === 0 ? <EmptyState title="Nothing matches">Try removing a filter.</EmptyState> : (
        <Card><CardContent className="p-2 sm:p-4">
          <Table>
            <THead><TR><TH>When</TH><TH>Who</TH><TH>Action</TH><TH>About</TH><TH>Details</TH></TR></THead>
            <TBody>
              {logs.map((l) => (
                <TR key={l.id}>
                  <TD className="whitespace-nowrap">{formatDateTime(l.createdAt)}</TD>
                  <TD>{l.actorId ? <><p className="font-medium">{nameOf.get(l.actorId) ?? "Removed user"}</p><p className="text-xs text-muted-foreground">{l.actorRole ? nice(l.actorRole) : ""}</p></> : <span className="text-muted-foreground">The public / the system</span>}</TD>
                  <TD><Badge variant={l.action.includes("FAILED") || l.action.includes("DISABLED") || l.action.includes("DEACTIVATED") || l.action.includes("REJECTED") ? "destructive" : "outline"}>{nice(l.action)}</Badge></TD>
                  <TD className="text-xs text-muted-foreground">{l.entityType ?? ""}{l.entityId ? <span className="block font-mono">{l.entityId.slice(0, 8)}</span> : null}</TD>
                  <TD className="max-w-xs text-xs text-muted-foreground">{compact(l.metadata)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent></Card>
      )}
      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {pages} · {total} entries</span>
          <span className="flex gap-3">{page > 1 && <Link href={href(page - 1)} className="text-primary underline underline-offset-4">Newer</Link>}{page < pages && <Link href={href(page + 1)} className="text-primary underline underline-offset-4">Older</Link>}</span>
        </nav>
      )}
    </>
  );
}
