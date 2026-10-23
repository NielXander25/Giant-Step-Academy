import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { ClassData } from "@/lib/results/class-data";
import { BatchBadge, SheetBadge } from "./status-badge";

type Data = NonNullable<ClassData>;

const COMPLETENESS = { COMPLETE: "Complete", INCOMPLETE: "Incomplete", MISSING: "No scores" } as const;

/** Subject progress and the calculated class results. Pages add their own action cards around it. */
export function ClassSheetView({ data, subjectHref, actions, remarks }: { data: Data; subjectHref: (subjectId: string) => string; actions?: React.ReactNode; remarks?: React.ReactNode }) {
  const status = data.sheet?.status ?? "DRAFT";
  const approved = data.subjects.filter((s) => s.expectedStudents > 0 && s.batch?.status === "FORM_TEACHER_APPROVED").length;
  const needed = data.subjects.filter((s) => s.expectedStudents > 0).length;
  const complete = data.summaries.filter((s) => s.completeness === "COMPLETE").length;
  const byId = new Map(data.summaries.map((s) => [s.enrollmentId, s]));
  const rows = [...data.students].sort((a, b) => (byId.get(a.enrollmentId)?.position ?? 9999) - (byId.get(b.enrollmentId)?.position ?? 9999) || a.fullName.localeCompare(b.fullName));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <SheetBadge status={status} />
        <span className="text-sm text-muted-foreground">{data.cls.name} · {data.term.name}, {data.term.sessionName}</span>
      </div>
      {data.sheet?.rejectionReason && status === "DRAFT" && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm">Sent back by the Admin: {data.sheet.rejectionReason}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Students" value={data.students.length} />
        <StatCard label="Subjects approved" value={`${approved} / ${needed}`} />
        <StatCard label="Students complete" value={`${complete} / ${data.students.length}`} />
      </div>

      {actions && (
        <Card>
          <CardHeader><CardTitle>Next step</CardTitle></CardHeader>
          <CardContent>{actions}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Subjects</CardTitle></CardHeader>
        <CardContent className="p-2 pt-0 sm:p-4 sm:pt-0">
          <Table>
            <THead><TR><TH>Subject</TH><TH>Teacher</TH><TH>Scores</TH><TH>Status</TH><TH><span className="sr-only">Open</span></TH></TR></THead>
            <TBody>
              {data.subjects.map((s) => (
                <TR key={s.subjectId}>
                  <TD className="font-medium">{s.name}{!s.isCompulsory && <Badge variant="outline" className="ml-2">Elective</Badge>}</TD>
                  <TD>{s.teacherName ?? <span className="text-muted-foreground">Not assigned</span>}</TD>
                  <TD>{s.expectedStudents === 0 ? "No students" : `${s.completeStudents} / ${s.expectedStudents}`}</TD>
                  <TD>
                    <BatchBadge status={s.batch?.status ?? "DRAFT"} />
                    {s.batch?.status === "FORM_TEACHER_REJECTED" && s.batch.lastRejectionReason && <p className="mt-1 max-w-56 text-xs text-muted-foreground">{s.batch.lastRejectionReason}</p>}
                  </TD>
                  <TD className="text-right">{s.expectedStudents > 0 && <Link href={subjectHref(s.subjectId)} className="text-primary underline underline-offset-4">Open</Link>}</TD>
                </TR>
              ))}
              {data.subjects.length === 0 && <TR><TD colSpan={5} className="text-muted-foreground">This class has no subjects yet. Add them on the Assignments page.</TD></TR>}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Class results</CardTitle>
          <CardDescription>Calculated from the scores entered so far. Positions appear once a student has every subject.</CardDescription>
        </CardHeader>
        <CardContent className="p-2 pt-0 sm:p-4 sm:pt-0">
          <Table>
            <THead><TR><TH>Position</TH><TH>Student</TH><TH>Total</TH><TH>Average</TH><TH>Grade</TH><TH>Status</TH></TR></THead>
            <TBody>
              {rows.map((st) => {
                const s = byId.get(st.enrollmentId);
                return (
                  <TR key={st.enrollmentId}>
                    <TD className="font-medium">{s?.position ?? "—"}</TD>
                    <TD><p className="font-medium">{st.fullName}</p><p className="text-xs text-muted-foreground">{st.admissionNumber}</p></TD>
                    <TD>{s?.totalScore ?? "—"}</TD>
                    <TD>{s?.average ?? "—"}</TD>
                    <TD>{s?.overallGrade ?? "—"}</TD>
                    <TD>{s ? COMPLETENESS[s.completeness] : "—"}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      {remarks}
    </div>
  );
}
