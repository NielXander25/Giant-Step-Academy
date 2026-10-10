import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AddStudentForm } from "@/components/students/add-student-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/auth/session";
import { getCurrentSessionId, loadTeacherScope } from "@/lib/permissions/assignments";
import { isFormTeacherOf } from "@/lib/permissions/policies";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My students" };

export default async function TeacherStudentsPage({ searchParams }: { searchParams: Promise<{ classId?: string }> }) {
  const user = await requireRole("TEACHER");
  const { classId } = await searchParams;
  const [scope, sessionId] = await Promise.all([loadTeacherScope(user.id), getCurrentSessionId()]);

  const classIds = [...new Set([...scope.formClassIds, ...scope.subjectAssignments.map((a) => a.classId)])];
  if (!sessionId || classIds.length === 0) {
    return (
      <>
        <PageHeader title="My students" />
        <EmptyState title="No classes yet">
          {sessionId ? "An Admin has not assigned you to a class or subject yet." : "An Admin must set a current academic session first."}
        </EmptyState>
      </>
    );
  }

  const classes = await db.schoolClass.findMany({
    where: { id: { in: classIds } },
    orderBy: [{ level: { sortOrder: "asc" } }, { arm: "asc" }],
    select: { id: true, name: true },
  });
  const selected = classes.find((c) => c.id === classId) ?? classes[0];
  const canManage = isFormTeacherOf(scope, selected.id);

  const [enrollments, pendingApprovals] = await Promise.all([
    db.enrollment.findMany({
      where: { classId: selected.id, sessionId, status: "ACTIVE", student: { status: "ACTIVE" } },
      include: { student: true },
      orderBy: { student: { fullName: "asc" } },
    }),
    scope.formClassIds.length
      ? db.studentImportBatch.count({ where: { classId: { in: scope.formClassIds }, status: "PENDING_APPROVAL" } })
      : Promise.resolve(0),
  ]);

  return (
    <>
      <PageHeader
        title="My students"
        description={canManage ? "You are the Form Teacher of this class: you can add, import and edit its students." : "You teach a subject in this class, so you can view its students and upload new ones for the Form Teacher to approve."}
      />

      {pendingApprovals > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-accent-soft px-4 py-3 text-sm">
          {pendingApprovals} student upload{pendingApprovals === 1 ? " is" : "s are"} waiting for your approval.{" "}
          <Link href="/teacher/students/approvals" className="font-medium text-primary underline underline-offset-4">Review</Link>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2" role="navigation" aria-label="Classes">
        {classes.map((c) => (
          <Link
            key={c.id}
            href={`/teacher/students?classId=${c.id}`}
            className={cn("rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-primary-soft", c.id === selected.id && "border-primary bg-primary text-primary-foreground hover:bg-primary")}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Button asChild><Link href="/teacher/students/import">Import from spreadsheet</Link></Button>
        <Button asChild variant="outline"><Link href="/teacher/students/approvals">Uploads and approvals</Link></Button>
      </div>

      {canManage && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add a student to {selected.name}</CardTitle>
            <CardDescription>For a whole class at once, use the spreadsheet import above.</CardDescription>
          </CardHeader>
          <CardContent><AddStudentForm fixedClassId={selected.id} /></CardContent>
        </Card>
      )}

      {enrollments.length === 0 ? (
        <EmptyState title={`No students in ${selected.name} yet`}>{canManage ? "Add a student above or import a spreadsheet." : "The Form Teacher or an Admin will add them."}</EmptyState>
      ) : (
        <Card>
          <CardHeader><CardTitle>{selected.name} · {enrollments.length} student{enrollments.length === 1 ? "" : "s"}</CardTitle></CardHeader>
          <CardContent className="p-2 pt-0 sm:p-4 sm:pt-0">
            <Table>
              <THead>
                <TR><TH>Admission no.</TH><TH>Name</TH><TH>Gender</TH>{canManage && <TH>Date of birth</TH>}{canManage && <TH><span className="sr-only">Actions</span></TH>}</TR>
              </THead>
              <TBody>
                {enrollments.map((e) => (
                  <TR key={e.id}>
                    <TD className="whitespace-nowrap font-medium">{e.student.admissionNumber}</TD>
                    <TD>{e.student.fullName}</TD>
                    <TD>{e.student.gender ? e.student.gender.toLowerCase() : <Badge variant="outline">Not set</Badge>}</TD>
                    {canManage && <TD>{formatDate(e.student.dateOfBirth)}</TD>}
                    {canManage && (
                      <TD className="text-right">
                        <Button asChild variant="outline" size="sm"><Link href={`/teacher/students/edit?student=${e.student.id}`}>Edit</Link></Button>
                      </TD>
                    )}
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
