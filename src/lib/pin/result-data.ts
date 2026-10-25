import { db } from "@/lib/db";
import { loadCalcConfig } from "@/lib/results/config-store";
import { getReportLayout } from "@/lib/results/report-layout-store";
import { round2 } from "@/lib/results/calc";
import { formatAttendance, parseAttendance, parseRatings } from "@/lib/results/report-card";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

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

  const [config, classSubjects, classEntries, school, layout, formTeacher] = await Promise.all([
    loadCalcConfig(enrollment.class.level.sectionId),
    db.classSubject.findMany({ where: { classId: enrollment.classId }, include: { subject: { select: { id: true, name: true } } } }),
    // Every student's entries in this class and term: needed for each subject's class average and position.
    db.resultEntry.findMany({
      where: { batch: { classId: enrollment.classId, termId }, enrollment: { id: { in: sheet.summaries.map((s) => s.enrollmentId) } } },
      select: { enrollmentId: true, scores: true, total: true, grade: true, remark: true, batch: { select: { subjectId: true } } },
    }),
    db.schoolProfile.findUnique({ where: { id: "singleton" } }),
    getReportLayout(),
    db.formTeacherAssignment.findUnique({ where: { classId_sessionId: { classId: enrollment.classId, sessionId: term.sessionId } }, include: { teacher: { select: { name: true } } } }),
  ]);

  const entries = classEntries.filter((e) => e.enrollmentId === enrollment.id);
  const entryOf = new Map(entries.map((e) => [e.batch.subjectId, e]));
  const bandRemark = new Map(config.bands.map((b) => [b.grade, b.remark ?? null]));
  const totalsBySubject = new Map<string, number[]>();
  for (const e of classEntries) {
    if (e.total === null) continue;
    totalsBySubject.set(e.batch.subjectId, [...(totalsBySubject.get(e.batch.subjectId) ?? []), Number(e.total)]);
  }

  const subjects = classSubjects
    .filter((cs) => entryOf.has(cs.subjectId))
    .sort((a, b) => a.subject.name.localeCompare(b.subject.name))
    .map((cs) => {
      const e = entryOf.get(cs.subjectId)!;
      const scores = e.scores as Record<string, number | null>;
      const total = e.total === null ? null : Number(e.total);
      const all = totalsBySubject.get(cs.subjectId) ?? [];
      return {
        name: cs.subject.name,
        scores: config.components.map((c) => scores[c.id] ?? null),
        total,
        classAverage: all.length ? round2(all.reduce((a, b) => a + b, 0) / all.length) : null,
        // Same total, same position; the next one skips (1, 2, 2, 4).
        position: total === null ? null : all.filter((t) => t > total).length + 1,
        grade: e.grade,
        remark: e.remark || (e.grade ? (bandRemark.get(e.grade) ?? null) : null),
      };
    });

  const ranked = sheet.summaries.filter((s) => s.position !== null).length;

  return {
    layout,
    school: {
      name: school?.name ?? "Giant Step Academy", motto: school?.motto ?? null, address: school?.address ?? null,
      phone: school?.phone ?? null, email: school?.email ?? null, logoUrl: school?.logoUrl ?? null, principalName: school?.principalName ?? null,
      isPlaceholder: school?.isPlaceholder ?? true,
    },
    student: {
      name: enrollment.student.fullName, admissionNumber: enrollment.student.admissionNumber, gender: enrollment.student.gender,
      dateOfBirth: enrollment.student.dateOfBirth ? dateFormat.format(enrollment.student.dateOfBirth) : null,
      stateOfOrigin: enrollment.student.stateOfOrigin, photoUrl: enrollment.student.photoUrl,
    },
    className: enrollment.class.name,
    classTeacherName: formTeacher?.teacher.name ?? null,
    sessionName: term.session.name,
    termName: term.name,
    resumption: term.resumptionDate ? dateFormat.format(term.resumptionDate) : null,
    componentNames: config.components.map((c) => ({ name: c.name, max: c.maxScore })),
    subjects,
    summary: {
      totalScore: summary.totalScore === null ? null : Number(summary.totalScore),
      average: summary.average === null ? null : Number(summary.average),
      overallGrade: summary.overallGrade,
      position: summary.position,
      classSize: ranked,
      attendance: formatAttendance(parseAttendance(summary.attendance)),
      ratings: parseRatings(summary.ratings),
      formTeacherRemark: summary.formTeacherRemark,
      principalRemark: summary.principalRemark,
      supervisorRemark: summary.supervisorRemark,
    },
  };
}
