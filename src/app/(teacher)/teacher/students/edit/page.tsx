import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/dashboard/page-header";
import { EditStudentForm } from "@/components/students/edit-student-form";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { getCurrentSessionId, loadTeacherScope } from "@/lib/permissions/assignments";
import { canManageClassStudents } from "@/lib/permissions/policies";
import { toDateInputValue } from "@/lib/students/normalize";

export const metadata: Metadata = { title: "Edit student" };

export default async function TeacherEditStudentPage({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  const user = await requireRole("TEACHER");
  const id = z.string().uuid().safeParse((await searchParams).student);
  const sessionId = await getCurrentSessionId();
  if (!id.success || !sessionId) notFound();

  const student = await db.student.findUnique({
    where: { id: id.data },
    include: { enrollments: { where: { sessionId }, include: { class: { select: { name: true } } } } },
  });
  const enrollment = student?.enrollments[0];
  // Same rule the server action enforces: only the Form Teacher of the student's class.
  if (!student || !enrollment || !canManageClassStudents(user, await loadTeacherScope(user.id), enrollment.classId)) notFound();

  return (
    <>
      <PageHeader title={student.fullName} description={`Class ${enrollment.class.name}`} />
      <p className="mb-4 text-sm"><Link href={`/teacher/students?classId=${enrollment.classId}`} className="text-primary underline underline-offset-4">← Back to the class</Link></p>
      <Card>
        <CardContent className="pt-6">
          <EditStudentForm
            isAdmin={false}
            initial={{
              studentId: student.id,
              admissionNumber: student.admissionNumber,
              fullName: student.fullName,
              gender: student.gender ?? "",
              dateOfBirth: toDateInputValue(student.dateOfBirth),
              status: student.status,
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
