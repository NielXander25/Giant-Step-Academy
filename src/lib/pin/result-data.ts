import { db } from "@/lib/db";
import { loadCalcConfig } from "@/lib/results/config-store";

export type PublishedResult = NonNullable<Awaited<ReturnType<typeof loadPublishedResult>>>;

/** A student's published result for one term, ready to display or print. Null if it is not published. */
export async function loadPublishedResult(studentId: string, termId: string) {
  const term = await db.term.findUnique({ where: { id: termId }, include: { session: { select: { name: true } } } });
  if (!term) return null;

  const enrollment = await db.enrollment.findUnique({
    where: { studentId_sessionId: { studentId, sessionId: term.sessionId } },
    include: { student: true, class: { select: { id: true, name: true, level: { select: { sectionId: true } } } } },
  });
  if (!enrollment) return null;

  const sheet = await db.classResultSheet.findFirst({
    where: { classId: enrollment.classId, termId, status: "PUBLISHED" },
    include: { summaries: true },
  });
  const summary = sheet?.summaries.find((s) => s.enrollmentId === enrollment.id);
  if (!sheet || !summary) return null;

  const [config, classSubjects, entries, school] = await Promise.all([
    loadCalcConfig(enrollment.class.level.sectionId),
    db.classSubject.findMany({ where: { classId: enrollment.classId }, include: { subject: { select: { id: true, name: true } } } }),
    db.resultEntry.findMany({ where: { enrollmentId: enrollment.id, batch: { classId: enrollment.classId, termId } }, include: { batch: { select: { subjectId: true } } } }),
    db.schoolProfile.findUnique({ where: { id: "singleton" } }),
  ]);

  const entryOf = new Map(entries.map((e) => [e.batch.subjectId, e]));
  const bandRemark = new Map(config.bands.map((b) => [b.grade, b.remark ?? null]));

  const subjects = classSubjects
    .filter((cs) => entryOf.has(cs.subjectId))
    .sort((a, b) => a.subject.name.localeCompare(b.subject.name))
    .map((cs) => {
      const e = entryOf.get(cs.subjectId)!;
      const scores = e.scores as Record<string, number | null>;
      return {
        name: cs.subject.name,
        scores: config.components.map((c) => scores[c.id] ?? null),
        total: e.total === null ? null : Number(e.total),
        grade: e.grade,
        remark: e.remark || (e.grade ? (bandRemark.get(e.grade) ?? null) : null),
      };
    });

  const ranked = sheet.summaries.filter((s) => s.position !== null).length;

  return {
    school: {
      name: school?.name ?? "Giant Step Academy", motto: school?.motto ?? null, address: school?.address ?? null,
      phone: school?.phone ?? null, email: school?.email ?? null, logoUrl: school?.logoUrl ?? null, principalName: school?.principalName ?? null,
      isPlaceholder: school?.isPlaceholder ?? true,
    },
    student: { name: enrollment.student.fullName, admissionNumber: enrollment.student.admissionNumber, gender: enrollment.student.gender },
    className: enrollment.class.name,
    sessionName: term.session.name,
    termName: term.name,
    componentNames: config.components.map((c) => ({ name: c.name, max: c.maxScore })),
    subjects,
    summary: {
      totalScore: summary.totalScore === null ? null : Number(summary.totalScore),
      average: summary.average === null ? null : Number(summary.average),
      overallGrade: summary.overallGrade,
      position: summary.position,
      classSize: ranked,
      formTeacherRemark: summary.formTeacherRemark,
      principalRemark: summary.principalRemark,
    },
  };
}
