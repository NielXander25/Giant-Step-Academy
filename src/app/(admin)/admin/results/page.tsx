import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SheetBadge } from "@/components/results/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { getCurrentTerm } from "@/lib/results/class-data";

export const metadata: Metadata = { title: "Results" };

export default async function AdminResultsPage() {
  await requireRole(...ADMIN_ROLES);
  const term = await getCurrentTerm();
  if (!term) {
    return (
      <>
        <PageHeader title="Results" />
        <EmptyState title="No current term">Set the current term on <Link href="/admin/sessions" className="text-primary underline">Sessions & terms</Link> first.</EmptyState>
      </>
    );
  }

  const [classes, sheets, batches, offered] = await Promise.all([
    db.schoolClass.findMany({ where: { isActive: true }, orderBy: [{ level: { sortOrder: "asc" } }, { arm: "asc" }], select: { id: true, name: true } }),
    db.classResultSheet.findMany({ where: { termId: term.id }, select: { classId: true, status: true } }),
    db.subjectResultBatch.findMany({ where: { termId: term.id }, select: { classId: true, status: true } }),
    db.classSubject.groupBy({ by: ["classId"], _count: { _all: true } }),
  ]);
  const sheetOf = new Map(sheets.map((s) => [s.classId, s.status as string]));
  const subjectsIn = new Map(offered.map((o) => [o.classId, o._count._all]));
  const approvedIn = new Map<string, number>();
  for (const b of batches) if (b.status === "FORM_TEACHER_APPROVED") approvedIn.set(b.classId, (approvedIn.get(b.classId) ?? 0) + 1);

  const waiting = classes.filter((c) => sheetOf.get(c.id) === "ADMIN_REVIEW").length;

  return (
    <>
      <PageHeader title="Results" description={`${term.name}, ${term.sessionName}. Review each class once its Form Teacher sends it in.`} />
      {waiting > 0 && <p className="mb-4 rounded-lg bg-accent-soft px-3 py-2 text-sm">{waiting} class{waiting === 1 ? " is" : "es are"} waiting for your review.</p>}
      {classes.length === 0 ? (
        <EmptyState title="No classes yet">Add classes first.</EmptyState>
      ) : (
        <Card>
          <CardContent className="p-2 sm:p-4">
            <Table>
              <THead><TR><TH>Class</TH><TH>Subjects approved</TH><TH>Status</TH><TH><span className="sr-only">Open</span></TH></TR></THead>
              <TBody>
                {classes.map((c) => (
                  <TR key={c.id}>
                    <TD className="font-medium">{c.name}</TD>
                    <TD>{approvedIn.get(c.id) ?? 0} / {subjectsIn.get(c.id) ?? 0}</TD>
                    <TD><SheetBadge status={sheetOf.get(c.id) ?? "DRAFT"} /></TD>
                    <TD className="text-right"><Link href={`/admin/results/sheet?class=${c.id}`} className="text-primary underline underline-offset-4">Open</Link></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
