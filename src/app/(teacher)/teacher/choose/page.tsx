import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { isDemoSite } from "@/lib/demo/mode";
import { getCurrentSessionId } from "@/lib/permissions/assignments";
import { releaseFormClassAction, releaseSubjectAction, takeFormClassAction, takeSubjectAction } from "./actions";

export const metadata: Metadata = { title: "Choose classes" };

export default async function ChooseClassesPage() {
  if (!isDemoSite()) notFound();
  const user = await requireRole("TEACHER");
  const sessionId = await getCurrentSessionId();
  if (!sessionId) {
    return <PageHeader title="Choose your classes" description="The practice school has not been loaded yet. Ask the Admin to load it." />;
  }

  // Only classes with practice students in the current session: the others have nothing to enter.
  const classes = await db.schoolClass.findMany({
    where: { isActive: true, enrollments: { some: { sessionId } } },
    orderBy: [{ level: { sortOrder: "asc" } }, { arm: "asc" }],
    select: {
      id: true, name: true,
      classSubjects: { select: { subject: { select: { id: true, name: true } } }, orderBy: { subject: { name: "asc" } } },
      subjectAssignments: { where: { sessionId }, select: { subjectId: true, teacherId: true, teacher: { select: { name: true } } } },
      formTeacherAssignments: { where: { sessionId }, select: { teacherId: true, teacher: { select: { name: true } } } },
    },
  });
  const myFormClass = classes.find((c) => c.formTeacherAssignments.some((f) => f.teacherId === user.id));
  const mySubjects = classes.reduce((n, c) => n + c.subjectAssignments.filter((a) => a.teacherId === user.id).length, 0);

  return (
    <>
      <PageHeader
        title="Choose your classes"
        description="Take the subjects you teach, in as many classes as you like, and be the Form Teacher of one class. Anything already taken shows who has it. Changes appear for everyone at once."
      />
      <p className="mb-6 text-sm text-muted-foreground">
        You teach <strong className="text-foreground">{mySubjects}</strong> {mySubjects === 1 ? "subject" : "subjects"}
        {myFormClass ? <> and are Form Teacher of <strong className="text-foreground">{myFormClass.name}</strong></> : null}.
        Then open <strong className="text-foreground">Result entry</strong> or <strong className="text-foreground">Reviews</strong> to start.
      </p>
      {classes.length === 0 && <p className="text-muted-foreground">No practice classes yet. Ask the Admin to load the practice school.</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        {classes.map((c) => {
          const form = c.formTeacherAssignments[0];
          const formIsMine = form?.teacherId === user.id;
          return (
            <Card key={c.id}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                <CardTitle>{c.name}</CardTitle>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Form Teacher:</span>
                  {formIsMine ? (
                    <>
                      <Badge variant="success">You</Badge>
                      <ActionButton action={releaseFormClassAction} input={{ classId: c.id }} label="Release" pendingLabel="Releasing…" />
                    </>
                  ) : form ? (
                    <Badge variant="outline">{form.teacher.name}</Badge>
                  ) : (
                    <ActionButton action={takeFormClassAction} input={{ classId: c.id }} label="Be Form Teacher" pendingLabel="Taking…" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {c.classSubjects.map(({ subject }) => {
                    const taken = c.subjectAssignments.find((a) => a.subjectId === subject.id);
                    const mine = taken?.teacherId === user.id;
                    return (
                      <li key={subject.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className={taken && !mine ? "text-muted-foreground" : "text-foreground"}>{subject.name}</span>
                        {mine ? (
                          <span className="flex items-center gap-2">
                            <Badge variant="success">Yours</Badge>
                            <ActionButton action={releaseSubjectAction} input={{ classId: c.id, subjectId: subject.id }} label="Release" pendingLabel="Releasing…" />
                          </span>
                        ) : taken ? (
                          <span className="text-xs text-muted-foreground">Taken by {taken.teacher.name}</span>
                        ) : (
                          <ActionButton action={takeSubjectAction} input={{ classId: c.id, subjectId: subject.id }} label="Take" pendingLabel="Taking…" variant="default" />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
