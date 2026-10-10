import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ImportUploader } from "@/components/students/import-uploader";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { getCurrentSessionId, loadTeacherScope } from "@/lib/permissions/assignments";
import { studentUploadRule } from "@/lib/permissions/policies";

export const metadata: Metadata = { title: "Import students" };

export default async function TeacherImportPage() {
  const user = await requireRole("TEACHER");
  const [scope, sessionId] = await Promise.all([loadTeacherScope(user.id), getCurrentSessionId()]);
  const classIds = [...new Set([...scope.formClassIds, ...scope.subjectAssignments.map((a) => a.classId)])];

  const classes = sessionId && classIds.length
    ? await db.schoolClass.findMany({ where: { id: { in: classIds }, isActive: true }, orderBy: [{ level: { sortOrder: "asc" } }, { arm: "asc" }], select: { id: true, name: true } })
    : [];
  const options = classes
    .map((c) => ({ id: c.id, name: c.name, rule: studentUploadRule(user, scope, c.id) }))
    .filter((c) => c.rule !== "DENIED")
    .map((c) => ({ id: c.id, name: c.name, needsApproval: c.rule === "NEEDS_FORM_TEACHER_APPROVAL" }));

  return (
    <>
      <PageHeader title="Import students" description="Download the template, fill it in, upload it, and check the preview. Nothing is saved until you confirm." />
      {options.length === 0 ? (
        <EmptyState title="Nothing to import into">{sessionId ? "You need to be assigned to a class first." : "An Admin must set a current academic session first."}</EmptyState>
      ) : (
        <Card><CardContent className="pt-6"><ImportUploader classes={options} reviewPath="/teacher/students/import/review" /></CardContent></Card>
      )}
    </>
  );
}
