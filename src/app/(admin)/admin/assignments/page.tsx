import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { getCurrentSessionId } from "@/lib/permissions/assignments";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { cn } from "@/lib/utils";
import { AddSubjectToClass, FormTeacherPicker, RemoveSubjectButton, SubjectTeacherPicker } from "./assignment-forms";

export const metadata: Metadata = { title: "Assignments" };

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ classId?: string }> }) {
  await requireRole(...ADMIN_ROLES);
  const { classId } = await searchParams;
  const sessionId = await getCurrentSessionId();

  if (!sessionId) {
    return (
      <>
        <PageHeader title="Assignments" />
        <EmptyState title="No current session">
          Assignments are kept per academic session. <Link href="/admin/sessions" className="text-primary underline">Create a session</Link> first.
        </EmptyState>
      </>
    );
  }

  const [session, classes] = await Promise.all([
    db.academicSession.findUnique({ where: { id: sessionId }, select: { name: true } }),
    db.schoolClass.findMany({ where: { isActive: true }, orderBy: [{ level: { sortOrder: "asc" } }, { arm: "asc" }], select: { id: true, name: true } }),
  ]);

  const selected = classId ? classes.find((c) => c.id === classId) : undefined;

  const detail = selected
    ? await Promise.all([
        db.formTeacherAssignment.findUnique({ where: { classId_sessionId: { classId: selected.id, sessionId } } }),
        db.classSubject.findMany({ where: { classId: selected.id }, include: { subject: true }, orderBy: { subject: { name: "asc" } } }),
        db.subjectAssignment.findMany({ where: { classId: selected.id, sessionId } }),
        db.user.findMany({ where: { role: "TEACHER", status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
        db.subject.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
      ])
    : null;

  return (
    <>
      <PageHeader
        title="Assignments"
        description={`Who teaches what in ${session?.name ?? "the current session"}. A Form Teacher manages one class; a Subject Teacher handles specific subjects in specific classes.`}
      />

      {classes.length === 0 ? (
        <EmptyState title="No classes yet">
          <Link href="/admin/classes" className="text-primary underline">Add classes</Link> first.
        </EmptyState>
      ) : (
        <div className="mb-8 flex flex-wrap gap-2" role="navigation" aria-label="Classes">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/admin/assignments?classId=${c.id}`}
              className={cn(
                "rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-primary-soft",
                c.id === selected?.id && "border-primary bg-primary text-primary-foreground hover:bg-primary",
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {selected && detail ? (
        (() => {
          const [formAssignment, classSubjects, subjectAssignments, teachers, allSubjects] = detail;
          const teacherOptions = teachers.map((t) => ({ id: t.id, label: `${t.name} (${t.email})` }));
          const offeredIds = new Set(classSubjects.map((cs) => cs.subjectId));
          const addable = allSubjects.filter((s) => !offeredIds.has(s.id)).map((s) => ({ id: s.id, label: s.name }));
          const teacherFor = new Map(subjectAssignments.map((a) => [a.subjectId, a.teacherId]));

          return (
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{selected.name} · Form Teacher</CardTitle>
                  <CardDescription>Manages this class's students and can enter any subject for it. Each teacher can lead one class per session.</CardDescription>
                </CardHeader>
                <CardContent>
                  {teachers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">There are no active teachers yet. Approve teacher requests first.</p>
                  ) : (
                    <FormTeacherPicker classId={selected.id} teachers={teacherOptions} currentId={formAssignment?.teacherId ?? null} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{selected.name} · Subjects and teachers</CardTitle>
                  <CardDescription>Choose the subjects this class offers, then assign one teacher to each.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  {classSubjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No subjects added to this class yet.</p>
                  ) : (
                    <Table>
                      <THead><TR><TH>Subject</TH><TH>Teacher</TH><TH><span className="sr-only">Actions</span></TH></TR></THead>
                      <TBody>
                        {classSubjects.map((cs) => (
                          <TR key={cs.id}>
                            <TD className="font-medium">
                              {cs.subject.name} {!teacherFor.has(cs.subjectId) && <Badge variant="outline">No teacher</Badge>}
                            </TD>
                            <TD>
                              <SubjectTeacherPicker classId={selected.id} subjectId={cs.subjectId} teachers={teacherOptions} currentId={teacherFor.get(cs.subjectId) ?? null} />
                            </TD>
                            <TD className="text-right">
                              <RemoveSubjectButton classId={selected.id} subjectId={cs.subjectId} name={cs.subject.name} />
                            </TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  )}
                  {addable.length > 0 && <AddSubjectToClass classId={selected.id} subjects={addable} />}
                </CardContent>
              </Card>
            </div>
          );
        })()
      ) : (
        classes.length > 0 && <EmptyState title="Choose a class">Pick a class above to set its Form Teacher and subject teachers.</EmptyState>
      )}
    </>
  );
}
