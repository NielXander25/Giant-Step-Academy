import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ClassSheetView } from "@/components/results/class-sheet-view";
import { RemarksForm } from "@/components/results/remarks-form";
import { SheetActions } from "@/components/results/sheet-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { loadTeacherScope } from "@/lib/permissions/assignments";
import { getCurrentTerm, loadClassData } from "@/lib/results/class-data";
import { sheetBlockers } from "@/lib/results/service";

export const metadata: Metadata = { title: "Class results" };

export default async function ReviewsPage() {
  const user = await requireRole("TEACHER");
  const scope = await loadTeacherScope(user.id);
  const classId = scope.formClassIds[0];

  if (!classId) {
    return (
      <>
        <PageHeader title="Class results" />
        <EmptyState title="You are not a Form Teacher">Only a class's Form Teacher reviews its results. Use Result entry for your own subjects.</EmptyState>
      </>
    );
  }
  const term = await getCurrentTerm();
  if (!term) return <EmptyState title="No current term">An Admin must set the current term first.</EmptyState>;
  const data = await loadClassData(classId, term);
  if (!data) return <EmptyState title="Class not found" />;

  const status = data.sheet?.status ?? "DRAFT";
  const approved = data.subjects.filter((s) => s.batch?.status === "FORM_TEACHER_APPROVED").map((s) => ({ id: s.subjectId, name: s.name }));
  const waiting = data.subjects.filter((s) => s.batch?.status === "SUBMITTED").length;

  return (
    <>
      <PageHeader title={`${data.cls.name} · class results`} description="Review each subject your colleagues submit, write your remarks, then send the class to the Admin." />
      {waiting > 0 && <p className="mb-4 rounded-lg bg-accent-soft px-3 py-2 text-sm">{waiting} subject{waiting === 1 ? " is" : "s are"} waiting for your review.</p>}
      <ClassSheetView
        data={data}
        subjectHref={(id) => `/teacher/reviews/subject?class=${classId}&subject=${id}`}
        actions={
          <SheetActions classId={classId} status={status} blockers={sheetBlockers(data)} canSubmit canReview={false} canPublish={false} approvedSubjects={approved} />
        }
        remarks={
          <Card>
            <CardHeader>
              <CardTitle>Report card details</CardTitle>
              <CardDescription>For each student: your comment, attendance, and the psychomotor and affective ratings (A–E). Tap a name to open it. You can edit until the class goes to the Admin.</CardDescription>
            </CardHeader>
            <CardContent>
              <RemarksForm classId={classId} kind="FORM_TEACHER" details disabled={status !== "DRAFT" || term.resultsLocked}
                students={data.students.map((s) => ({ enrollmentId: s.enrollmentId, fullName: s.fullName, remark: s.formTeacherRemark ?? "", ratings: s.ratings, attendance: s.attendance }))} />
            </CardContent>
          </Card>
        }
      />
    </>
  );
}
