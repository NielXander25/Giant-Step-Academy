import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { BatchBadge } from "@/components/results/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireRole } from "@/lib/auth/session";
import { loadTeacherScope } from "@/lib/permissions/assignments";
import { getCurrentTerm, listTeacherTasks } from "@/lib/results/class-data";

export const metadata: Metadata = { title: "Result entry" };

export default async function TeacherResultsPage() {
  const user = await requireRole("TEACHER");
  const [scope, term] = await Promise.all([loadTeacherScope(user.id), getCurrentTerm()]);

  if (!term) {
    return (
      <>
        <PageHeader title="Result entry" />
        <EmptyState title="No current term">An Admin must set the current term before results can be entered.</EmptyState>
      </>
    );
  }
  const tasks = await listTeacherTasks(scope, term);

  return (
    <>
      <PageHeader title="Result entry" description={`${term.name}, ${term.sessionName}. Enter scores for the subjects you teach, then submit them.`} />
      {tasks.length === 0 ? (
        <EmptyState title="Nothing to enter yet">An Admin has not assigned you to a subject or class for this session.</EmptyState>
      ) : (
        <Card>
          <CardContent className="p-2 sm:p-4">
            <Table>
              <THead><TR><TH>Class</TH><TH>Subject</TH><TH>You are</TH><TH>Scores complete</TH><TH>Status</TH><TH><span className="sr-only">Open</span></TH></TR></THead>
              <TBody>
                {tasks.map((t) => (
                  <TR key={`${t.classId}:${t.subjectId}`}>
                    <TD className="font-medium">{t.className}</TD>
                    <TD>{t.subjectName}</TD>
                    <TD>{t.role === "FORM_TEACHER" ? <Badge variant="accent">Form Teacher</Badge> : <Badge variant="outline">Subject teacher</Badge>}</TD>
                    <TD>{t.complete} / {t.expected}</TD>
                    <TD><BatchBadge status={t.status} /></TD>
                    <TD className="text-right"><Link href={`/teacher/results/entry?class=${t.classId}&subject=${t.subjectId}`} className="text-primary underline underline-offset-4">Open</Link></TD>
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
