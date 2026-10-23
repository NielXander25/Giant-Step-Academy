import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ClassSheetView } from "@/components/results/class-sheet-view";
import { RemarksForm } from "@/components/results/remarks-form";
import { SheetActions } from "@/components/results/sheet-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { getCurrentTerm, loadClassData } from "@/lib/results/class-data";
import { sheetBlockers } from "@/lib/results/service";

export const metadata: Metadata = { title: "Class results" };

export default async function AdminSheetPage({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const user = await requireRole(...ADMIN_ROLES);
  const id = z.string().uuid().safeParse((await searchParams).class);
  if (!id.success) notFound();
  const term = await getCurrentTerm();
  if (!term) return <EmptyState title="No current term" />;
  const data = await loadClassData(id.data, term);
  if (!data) notFound();

  const status = data.sheet?.status ?? "DRAFT";
  const approved = data.subjects.filter((s) => s.batch?.status === "FORM_TEACHER_APPROVED").map((s) => ({ id: s.subjectId, name: s.name }));

  return (
    <>
      <PageHeader title={`${data.cls.name} · class results`} description="Check the results, add the principal's remarks, then approve and publish." />
      <p className="mb-4 text-sm"><Link href="/admin/results" className="text-primary underline underline-offset-4">← All classes</Link></p>
      <ClassSheetView
        data={data}
        subjectHref={(sid) => `/admin/results/subject?class=${id.data}&subject=${sid}`}
        actions={
          <SheetActions classId={id.data} status={status} blockers={sheetBlockers(data)} canSubmit={false} canReview canPublish approvedSubjects={approved} />
        }
        remarks={
          <Card>
            <CardHeader>
              <CardTitle>Principal's remarks</CardTitle>
              <CardDescription>Shown on each student's report card. Editable until the results are published.</CardDescription>
            </CardHeader>
            <CardContent>
              <RemarksForm classId={id.data} kind="PRINCIPAL" disabled={status === "PUBLISHED"}
                students={data.students.map((s) => ({ enrollmentId: s.enrollmentId, fullName: s.fullName, remark: s.principalRemark ?? "" }))} />
            </CardContent>
          </Card>
        }
      />
      <p className="mt-6 text-xs text-muted-foreground">Signed in as {user.name}. Anyone who sent the class in cannot also approve it.</p>
    </>
  );
}
