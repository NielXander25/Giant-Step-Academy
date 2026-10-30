import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formTeacherTeachesAll } from "@/lib/curriculum";
import { db } from "@/lib/db";

/** Every class at a glance: its Form Teacher and who teaches each subject. */
export async function AssignmentsOverview({ sessionId }: { sessionId: string }) {
  const classes = await db.schoolClass.findMany({
    where: { isActive: true },
    orderBy: [{ level: { sortOrder: "asc" } }, { arm: "asc" }],
    select: {
      id: true, name: true, level: { select: { name: true } },
      formTeacherAssignments: { where: { sessionId }, select: { teacher: { select: { name: true } } } },
      classSubjects: { select: { subject: { select: { id: true, name: true } } }, orderBy: { subject: { name: "asc" } } },
      subjectAssignments: { where: { sessionId }, select: { subjectId: true, teacher: { select: { name: true } } } },
    },
  });

  return (
    <section>
      <h2 className="mb-1 text-2xl text-navy">All classes</h2>
      <p className="mb-5 text-sm text-muted-foreground">Pick a class above, or <strong>Change</strong> below, to edit it. In Nursery and Primary the Form Teacher teaches every subject unless a subject has its own teacher, whose scores the Form Teacher then reviews.</p>
      <div className="grid gap-5 lg:grid-cols-2">
        {classes.map((c) => {
          const wholeClass = formTeacherTeachesAll(c.level.name);
          const form = c.formTeacherAssignments[0]?.teacher.name;
          const teacherOf = new Map(c.subjectAssignments.map((a) => [a.subjectId, a.teacher.name]));
          return (
            <Card key={c.id}>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle>{c.name}</CardTitle>
                  <p className="mt-1 text-sm">
                    <span className="text-muted-foreground">Form Teacher: </span>
                    {form ? <strong className="text-navy">{form}</strong> : <Badge variant="outline">Not chosen</Badge>}
                  </p>
                </div>
                <Link href={`/admin/assignments?classId=${c.id}`} className="text-sm font-semibold text-primary underline underline-offset-4">Change</Link>
              </CardHeader>
              <CardContent>
                {c.classSubjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No subjects yet.</p>
                ) : (
                  <ul className="divide-y divide-border text-sm">
                    {c.classSubjects.map(({ subject }) => {
                      const own = teacherOf.get(subject.id);
                      return (
                        <li key={subject.id} className="flex items-center justify-between gap-3 py-1.5">
                          <span>{subject.name}</span>
                          {own ? (
                            <span className="text-right font-medium text-navy">{own}</span>
                          ) : wholeClass ? (
                            <span className="text-right text-muted-foreground">{form ? `${form} (Form Teacher)` : "Form Teacher"}</span>
                          ) : (
                            <Badge variant="outline">No teacher</Badge>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
