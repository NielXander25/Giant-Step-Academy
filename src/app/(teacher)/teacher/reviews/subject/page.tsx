import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ReviewActions } from "@/components/results/review-actions";
import { BatchBadge } from "@/components/results/status-badge";
import { SubjectScoresTable } from "@/components/results/subject-scores-table";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { loadTeacherScope } from "@/lib/permissions/assignments";
import { canFormTeacherReview, canReopenSubject, isFormTeacherOf } from "@/lib/permissions/policies";
import { getCurrentTerm } from "@/lib/results/class-data";
import { loadSubjectView } from "@/lib/results/subject-view";
import { canEditBatch } from "@/lib/results/workflow";

export const metadata: Metadata = { title: "Review subject" };

const ids = z.object({ class: z.string().uuid(), subject: z.string().uuid() });

export default async function ReviewSubjectPage({ searchParams }: { searchParams: Promise<{ class?: string; subject?: string }> }) {
  const user = await requireRole("TEACHER");
  const parsed = ids.safeParse(await searchParams);
  if (!parsed.success) notFound();
  const { class: classId, subject: subjectId } = parsed.data;

  const scope = await loadTeacherScope(user.id);
  if (!isFormTeacherOf(scope, classId)) notFound();

  const term = await getCurrentTerm();
  if (!term) return <EmptyState title="No current term" />;
  const view = await loadSubjectView(classId, subjectId, term);
  if (!view) notFound();

  const status = view.batch?.status ?? "DRAFT";
  const canReview = status === "SUBMITTED" && view.sheetStatus === "DRAFT" && canFormTeacherReview(user, scope, { classId, submittedById: view.batch?.submittedById ?? null });
  const canReopen = status === "FORM_TEACHER_APPROVED" && view.sheetStatus === "DRAFT" && canReopenSubject(user, scope, classId);
  const canEdit = canEditBatch(status, view.sheetStatus) && !term.resultsLocked;

  return (
    <>
      <PageHeader title={`${view.roster.subjectName} · ${view.roster.className}`} description={`${term.name}, ${term.sessionName}`} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <BatchStatus status={status} />
        <Link href="/teacher/reviews" className="text-sm text-primary underline underline-offset-4">← Class results</Link>
        {canEdit && <Link href={`/teacher/results/entry?class=${classId}&subject=${subjectId}`} className="text-sm text-primary underline underline-offset-4">Enter or edit these scores</Link>}
      </div>
      {status === "SUBMITTED" && view.batch?.submittedById === user.id && (
        <p className="mb-4 rounded-lg bg-accent-soft px-3 py-2 text-sm">You submitted these results yourself, so someone else cannot be asked to review them. They go straight to the Admin stage.</p>
      )}
      {(canReview || canReopen) && (
        <Card className="mb-6"><CardContent className="pt-6"><ReviewActions classId={classId} subjectId={subjectId} canReview={canReview} canReopen={canReopen} /></CardContent></Card>
      )}
      <Card>
        <CardContent className="p-2 sm:p-4">
          <SubjectScoresTable components={view.config.components} bands={view.config.bands} rows={view.rows} />
        </CardContent>
      </Card>
    </>
  );
}

function BatchStatus({ status }: { status: string }) {
  return <BatchBadge status={status} />;
}
