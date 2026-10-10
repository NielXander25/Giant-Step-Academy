import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { AddStudentForm } from "@/components/students/add-student-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { getCurrentSessionId } from "@/lib/permissions/assignments";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { normalizeAdmissionNumber } from "@/lib/students/normalize";
import { setRepeater } from "@/lib/students/actions";

export const metadata: Metadata = { title: "Students" };

const PAGE_SIZE = 50;

export default async function AdminStudentsPage({ searchParams }: { searchParams: Promise<{ classId?: string; q?: string; page?: string }> }) {
  await requireRole(...ADMIN_ROLES);
  const sp = await searchParams;
  const sessionId = await getCurrentSessionId();

  if (!sessionId) {
    return (
      <>
        <PageHeader title="Students" />
        <EmptyState title="No current session">
          Students are enrolled per session. <Link href="/admin/sessions" className="text-primary underline">Create a session</Link> first.
        </EmptyState>
      </>
    );
  }

  const q = (sp.q ?? "").trim().slice(0, 60);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const classes = await db.schoolClass.findMany({ where: { isActive: true }, orderBy: [{ level: { sortOrder: "asc" } }, { arm: "asc" }], select: { id: true, name: true } });
  const classId = classes.find((c) => c.id === sp.classId)?.id;

  const where: Prisma.StudentWhereInput = {
    ...(classId ? { enrollments: { some: { sessionId, classId } } } : {}),
    ...(q ? { OR: [{ fullName: { contains: q, mode: "insensitive" } }, { admissionNumber: { contains: normalizeAdmissionNumber(q) } }] } : {}),
  };

  const [total, students, pendingBatches] = await Promise.all([
    db.student.count({ where }),
    db.student.findMany({
      where,
      orderBy: { fullName: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { enrollments: { where: { sessionId }, include: { class: { select: { name: true } } } } },
    }),
    db.studentImportBatch.findMany({
      where: { status: "PENDING_APPROVAL" },
      orderBy: { createdAt: "asc" },
      include: { class: { select: { name: true } }, uploadedBy: { select: { name: true } } },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (p: number) => `/admin/students?${new URLSearchParams({ ...(classId ? { classId } : {}), ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Students" description="Every student on record, with their class this session. Students are never deleted, only made inactive, so old results stay intact." />

      <div className="mb-6 flex flex-wrap gap-3">
        <Button asChild><Link href="/admin/students/import">Import from spreadsheet</Link></Button>
      </div>

      {pendingBatches.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Uploads waiting for approval ({pendingBatches.length})</CardTitle>
            <CardDescription>Normally the class's Form Teacher approves these. You can step in, for example when a class has no Form Teacher yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {pendingBatches.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span>{b.class.name} · {b.fileName} · by {b.uploadedBy.name}</span>
                  <Link href={`/admin/students/import/review?batch=${b.id}`} className="text-primary underline underline-offset-4">Review</Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader><CardTitle>Add one student</CardTitle></CardHeader>
        <CardContent>
          {classes.length === 0 ? <p className="text-sm text-muted-foreground">Add classes first.</p> : <AddStudentForm classes={classes} />}
        </CardContent>
      </Card>

      <form className="mb-4 flex flex-wrap items-end gap-3" action="/admin/students">
        <div className="flex flex-col gap-1">
          <label htmlFor="f-class" className="text-xs text-muted-foreground">Class</label>
          <Select id="f-class" name="classId" defaultValue={classId ?? ""} className="min-w-40">
            <option value="">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="f-q" className="text-xs text-muted-foreground">Search name or admission number</label>
          <Input id="f-q" name="q" defaultValue={q} className="min-w-56" />
        </div>
        <Button type="submit" variant="outline">Filter</Button>
      </form>

      {students.length === 0 ? (
        <EmptyState title="No students found">Add a student, import a spreadsheet, or change the filter.</EmptyState>
      ) : (
        <Card>
          <CardContent className="p-2 sm:p-4">
            <Table>
              <THead>
                <TR><TH>Admission no.</TH><TH>Name</TH><TH>Class this session</TH><TH>Status</TH><TH>Repeating?</TH><TH><span className="sr-only">Actions</span></TH></TR>
              </THead>
              <TBody>
                {students.map((s) => {
                  const enrollment = s.enrollments[0];
                  return (
                    <TR key={s.id}>
                      <TD className="whitespace-nowrap font-medium">{s.admissionNumber}</TD>
                      <TD>{s.fullName}</TD>
                      <TD>{enrollment?.class.name ?? <span className="text-muted-foreground">Not enrolled</span>}</TD>
                      <TD>{s.status === "ACTIVE" ? <Badge variant="success">Active</Badge> : <Badge variant="outline">{s.status.toLowerCase()}</Badge>}</TD>
                      <TD>
                        {enrollment ? (
                          <span className="flex items-center gap-2">
                            {enrollment.isRepeater ? <Badge variant="accent">Repeats</Badge> : <span className="text-muted-foreground">No</span>}
                            <ActionButton action={setRepeater} input={{ enrollmentId: enrollment.id, isRepeater: !enrollment.isRepeater }} label={enrollment.isRepeater ? "Clear" : "Mark"} />
                          </span>
                        ) : "—"}
                      </TD>
                      <TD className="text-right"><Button asChild variant="outline" size="sm"><Link href={`/admin/students/edit?student=${s.id}`}>Edit</Link></Button></TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {pages} · {total} students</span>
          <span className="flex gap-3">
            {page > 1 && <Link href={link(page - 1)} className="text-primary underline underline-offset-4">Previous</Link>}
            {page < pages && <Link href={link(page + 1)} className="text-primary underline underline-offset-4">Next</Link>}
          </span>
        </nav>
      )}
    </>
  );
}
