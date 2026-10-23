import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ScoreGrid } from "@/components/results/score-grid";
import { BatchBadge } from "@/components/results/status-badge";
import { requireRole } from "@/lib/auth/session";
import { loadTeacherScope } from "@/lib/permissions/assignments";
import { canEnterScores, isFormTeacherOf } from "@/lib/permissions/policies";
import { getCurrentTerm } from "@/lib/results/class-data";
import { loadSubjectView } from "@/lib/results/subject-view";
import { canEditBatch } from "@/lib/results/workflow";

export const metadata: Metadata = { title: "Enter scores" };

const ids = z.object({ class: z.string().uuid(), subject: z.string().uuid() });

export default async function EntryPage({ searchParams }: { searchParams: Promise<{ class?: string; subject?: string }> }) {
  const user = await requireRole("TEACHER");
  const parsed = ids.safeParse(await searchParams);
  if (!parsed.success) notFound();
  const target = { classId: parsed.data.class, subjectId: parsed.data.subject };

  // The same rule the server enforces on save: a wrong class or subject in the address is just "not found".
  const scope = await loadTeacherScope(user.id);
  if (!canEnterScores(user, scope, target)) notFound();

  const term = await getCurrentTerm();
  if (!term) return <EmptyState title="No current term">An Admin must set the current term first.</EmptyState>;
  const view = await loadSubjectView(target.classId, target.subjectId, term);
  if (!view) notFound();

  const status = view.batch?.status ?? "DRAFT";
  const canEdit = canEditBatch(status, view.sheetStatus) && !term.resultsLocked;
  const ready = view.config.components.length > 0 && view.config.bands.length > 0;

  return (
    <>
      <PageHeader title={`${view.roster.subjectName} · ${view.roster.className}`} description={`${term.name}, ${term.sessionName}`} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <BatchBadge status={status} />
        <Link href="/teacher/results" className="text-sm text-primary underline underline-offset-4">← All my subjects</Link>
      </div>

      {status === "FORM_TEACHER_REJECTED" && view.batch?.lastRejectionReason && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-destructive">Sent back for correction: {view.batch.lastRejectionReason}</p>
      )}
      {!canEdit && ready && (
        <p className="mb-4 rounded-lg bg-accent-soft px-3 py-2 text-sm">
          {term.resultsLocked ? "Results for this term are locked." : status === "SUBMITTED" ? "Submitted. Waiting for the Form Teacher to review." : "These results can no longer be changed here."}
        </p>
      )}

      {!ready ? (
        <EmptyState title="Grading is not set up yet">An Admin needs to set up the score components and grades before scores can be entered.</EmptyState>
      ) : view.rows.length === 0 ? (
        <EmptyState title="No students yet">There are no students in this class for this subject yet.</EmptyState>
      ) : (
        <ScoreGrid
          key={`${status}:${view.batch?.id ?? "new"}`}
          classId={target.classId}
          subjectId={target.subjectId}
          components={view.config.components}
          bands={view.config.bands}
          rows={view.rows}
          canEdit={canEdit}
          byFormTeacher={isFormTeacherOf(scope, target.classId)}
        />
      )}
    </>
  );
}
