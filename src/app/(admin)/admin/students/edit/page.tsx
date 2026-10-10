import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { EditStudentForm } from "@/components/students/edit-student-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { requireRole } from "@/lib/auth/session";
import { getCurrentSessionId } from "@/lib/permissions/assignments";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { toDateInputValue } from "@/lib/students/normalize";
import { setRepeater } from "@/lib/students/actions";

export const metadata: Metadata = { title: "Edit student" };

export default async function AdminEditStudentPage({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  await requireRole(...ADMIN_ROLES);
  const id = z.string().uuid().safeParse((await searchParams).student);
  if (!id.success) notFound();
  const sessionId = await getCurrentSessionId();

  const student = await db.student.findUnique({
    where: { id: id.data },
    include: { enrollments: { orderBy: { createdAt: "desc" }, include: { class: { select: { name: true } }, session: { select: { name: true, id: true } } } } },
  });
  if (!student) notFound();
  const current = student.enrollments.find((e) => e.session.id === sessionId);

  return (
    <>
      <PageHeader title={student.fullName} description={`Admission number ${student.admissionNumber} · added ${formatDate(student.createdAt)}`} />
      <p className="mb-4 text-sm"><Link href="/admin/students" className="text-primary underline underline-offset-4">← Back to students</Link></p>

      <Card className="mb-6">
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent>
          <EditStudentForm
            isAdmin
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Promotion</CardTitle>
          <CardDescription>At the end of the year, Admins promote everyone to the next class except students marked as repeating.</CardDescription>
        </CardHeader>
        <CardContent>
          {current ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm">{current.class.name} this session ·</span>
              {current.isRepeater ? <Badge variant="accent">Marked to repeat</Badge> : <Badge variant="outline">Will be promoted</Badge>}
              <ActionButton action={setRepeater} input={{ enrollmentId: current.id, isRepeater: !current.isRepeater }} label={current.isRepeater ? "Clear repeat flag" : "Mark to repeat"} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not enrolled in the current session.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Class history</CardTitle></CardHeader>
        <CardContent>
          <ul className="divide-y divide-border text-sm">
            {student.enrollments.map((e) => (
              <li key={e.id} className="flex justify-between py-2"><span>{e.session.name}</span><span>{e.class.name}</span></li>
            ))}
            {student.enrollments.length === 0 && <li className="py-2 text-muted-foreground">No enrollments yet.</li>}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
