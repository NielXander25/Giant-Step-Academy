import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { loadTeacherScope } from "@/lib/permissions/assignments";

export const metadata: Metadata = { title: "Teacher overview" };

export default async function TeacherOverview() {
  const user = await requireRole("TEACHER");
  const scope = await loadTeacherScope(user.id);

  const isFormTeacher = scope.formClassIds.length > 0;
  const subjectCount = scope.subjectAssignments.length;

  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(" ")[0]}`} description="Your classes and subjects, as assigned by the school." />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Form class" value={isFormTeacher ? scope.formClassIds.length : 0} hint={isFormTeacher ? "You are a Form Teacher" : "Not a Form Teacher"} />
        <StatCard label="Subject assignments" value={subjectCount} />
      </div>
      {!isFormTeacher && subjectCount === 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Waiting for assignments</CardTitle>
            <CardDescription>
              An Admin has not assigned you to any class or subject yet. They will appear here as soon as they do.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </>
  );
}
