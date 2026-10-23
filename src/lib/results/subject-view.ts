import { db } from "@/lib/db";
import { loadCalcConfig } from "./config-store";
import { loadRoster, type CurrentTerm } from "./class-data";

export type SubjectViewRow = { enrollmentId: string; admissionNumber: string; fullName: string; scores: Record<string, number | null>; remark: string };

/** One subject in one class this term: the students, their saved scores and the current status. */
export async function loadSubjectView(classId: string, subjectId: string, term: CurrentTerm) {
  const roster = await loadRoster(classId, subjectId, term);
  if (!roster) return null;

  const [config, batch, sheet] = await Promise.all([
    loadCalcConfig(roster.sectionId),
    db.subjectResultBatch.findUnique({
      where: { classId_subjectId_termId: { classId, subjectId, termId: term.id } },
      include: { entries: true },
    }),
    db.classResultSheet.findUnique({ where: { classId_termId: { classId, termId: term.id } }, select: { status: true } }),
  ]);

  const entryOf = new Map((batch?.entries ?? []).map((e) => [e.enrollmentId, e]));
  const rows: SubjectViewRow[] = roster.students.map((s) => {
    const e = entryOf.get(s.enrollmentId);
    return { ...s, scores: (e?.scores as Record<string, number | null> | undefined) ?? {}, remark: e?.remark ?? "" };
  });

  return {
    roster,
    config,
    rows,
    batch: batch ? { id: batch.id, status: batch.status as string, submittedById: batch.submittedById, lastRejectionReason: batch.lastRejectionReason } : null,
    sheetStatus: (sheet?.status ?? "DRAFT") as string,
  };
}
