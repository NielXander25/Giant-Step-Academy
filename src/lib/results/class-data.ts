import { db } from "@/lib/db";
import type { TeacherScope } from "@/lib/permissions/policies";
import { computeClass, type CalcConfig, type StudentInput, type StudentSummary, type SubjectScores } from "./calc";
import { loadCalcConfig } from "./config-store";

export type CurrentTerm = { id: string; name: string; sessionId: string; sessionName: string; resultsLocked: boolean };

export async function getCurrentTerm(): Promise<CurrentTerm | null> {
  const t = await db.term.findFirst({ where: { isCurrent: true }, include: { session: { select: { name: true } } } });
  return t ? { id: t.id, name: t.name, sessionId: t.sessionId, sessionName: t.session.name, resultsLocked: t.resultsLocked } : null;
}

export type RosterStudent = { enrollmentId: string; admissionNumber: string; fullName: string };

/** The students who must have a score for this subject in this class this session. Null if the class does not offer the subject. */
export async function loadRoster(classId: string, subjectId: string, term: CurrentTerm) {
  const cs = await db.classSubject.findUnique({
    where: { classId_subjectId: { classId, subjectId } },
    include: { subject: { select: { name: true } }, class: { select: { name: true, level: { select: { sectionId: true } } } } },
  });
  if (!cs) return null;

  const enrollments = await db.enrollment.findMany({
    where: {
      classId,
      sessionId: term.sessionId,
      status: "ACTIVE",
      student: { status: "ACTIVE" },
      ...(cs.isCompulsory ? {} : { subjects: { some: { subjectId } } }), // electives: only students who take it
    },
    include: { student: { select: { admissionNumber: true, fullName: true } } },
    orderBy: { student: { fullName: "asc" } },
  });

  return {
    classId,
    className: cs.class.name,
    sectionId: cs.class.level.sectionId,
    subjectId,
    subjectName: cs.subject.name,
    isCompulsory: cs.isCompulsory,
    students: enrollments.map<RosterStudent>((e) => ({ enrollmentId: e.id, admissionNumber: e.student.admissionNumber, fullName: e.student.fullName })),
  };
}

export type SubjectRow = {
  subjectId: string;
  name: string;
  isCompulsory: boolean;
  expectedStudents: number;
  completeStudents: number;
  teacherName: string | null;
  batch: { id: string; status: string; submittedById: string | null; lastRejectionReason: string | null } | null;
};

export type ClassData = Awaited<ReturnType<typeof loadClassData>>;

/** Everything about one class for one term: students, subjects, statuses and the calculated results. */
export async function loadClassData(classId: string, term: CurrentTerm) {
  const cls = await db.schoolClass.findUnique({ where: { id: classId }, select: { id: true, name: true, level: { select: { sectionId: true } } } });
  if (!cls) return null;

  const [classSubjects, enrollments, batches, sheet, assignments, config] = await Promise.all([
    db.classSubject.findMany({ where: { classId }, include: { subject: { select: { id: true, name: true } } }, orderBy: { subject: { name: "asc" } } }),
    db.enrollment.findMany({
      where: { classId, sessionId: term.sessionId, status: "ACTIVE", student: { status: "ACTIVE" } },
      include: { student: { select: { admissionNumber: true, fullName: true } }, subjects: { select: { subjectId: true } } },
      orderBy: { student: { fullName: "asc" } },
    }),
    db.subjectResultBatch.findMany({ where: { classId, termId: term.id }, include: { entries: true } }),
    db.classResultSheet.findUnique({ where: { classId_termId: { classId, termId: term.id } }, include: { summaries: true } }),
    db.subjectAssignment.findMany({ where: { classId, sessionId: term.sessionId }, include: { teacher: { select: { name: true } } } }),
    loadCalcConfig(cls.level.sectionId),
  ]);

  const batchBySubject = new Map(batches.map((b) => [b.subjectId, b]));
  const teacherBySubject = new Map(assignments.map((a) => [a.subjectId, a.teacher.name]));

  const inputs: StudentInput[] = enrollments.map((e) => {
    const electives = new Set(e.subjects.map((s) => s.subjectId));
    const expectedSubjectIds = classSubjects.filter((cs) => cs.isCompulsory || electives.has(cs.subjectId)).map((cs) => cs.subjectId);
    const subjects: Record<string, SubjectScores | undefined> = {};
    for (const id of expectedSubjectIds) {
      const entry = batchBySubject.get(id)?.entries.find((x) => x.enrollmentId === e.id);
      subjects[id] = entry ? (entry.scores as SubjectScores) : undefined;
    }
    return { enrollmentId: e.id, expectedSubjectIds, subjects };
  });

  const calc: CalcConfig = config;
  const summaries: StudentSummary[] = computeClass(inputs, calc);
  const remarks = new Map((sheet?.summaries ?? []).map((s) => [s.enrollmentId, s]));

  const subjects: SubjectRow[] = classSubjects.map((cs) => {
    const b = batchBySubject.get(cs.subjectId);
    return {
      subjectId: cs.subjectId,
      name: cs.subject.name,
      isCompulsory: cs.isCompulsory,
      expectedStudents: inputs.filter((i) => i.expectedSubjectIds.includes(cs.subjectId)).length,
      completeStudents: summaries.filter((s) => s.subjects[cs.subjectId]?.status === "COMPLETE").length,
      teacherName: teacherBySubject.get(cs.subjectId) ?? null,
      batch: b ? { id: b.id, status: b.status, submittedById: b.submittedById, lastRejectionReason: b.lastRejectionReason } : null,
    };
  });

  return {
    cls: { id: cls.id, name: cls.name, sectionId: cls.level.sectionId },
    term,
    config,
    sheet: sheet ? { id: sheet.id, status: sheet.status, rejectionReason: sheet.rejectionReason, publishedAt: sheet.publishedAt } : null,
    subjects,
    summaries,
    students: enrollments.map((e) => ({
      enrollmentId: e.id,
      admissionNumber: e.student.admissionNumber,
      fullName: e.student.fullName,
      formTeacherRemark: remarks.get(e.id)?.formTeacherRemark ?? null,
      principalRemark: remarks.get(e.id)?.principalRemark ?? null,
    })),
  };
}

export type EntryTask = {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  role: "FORM_TEACHER" | "SUBJECT_TEACHER";
  expected: number;
  complete: number;
  status: string;
};

/** The class + subject pairs a teacher can enter results for this term. */
export async function listTeacherTasks(scope: TeacherScope, term: CurrentTerm): Promise<EntryTask[]> {
  const pairs = new Map<string, { classId: string; subjectId: string; role: EntryTask["role"] }>();
  for (const a of scope.subjectAssignments) pairs.set(`${a.classId}:${a.subjectId}`, { ...a, role: "SUBJECT_TEACHER" });
  if (scope.formClassIds.length) {
    const own = await db.classSubject.findMany({ where: { classId: { in: scope.formClassIds } }, select: { classId: true, subjectId: true } });
    for (const cs of own) pairs.set(`${cs.classId}:${cs.subjectId}`, { ...cs, role: "FORM_TEACHER" });
  }
  const list = [...pairs.values()];
  if (list.length === 0) return [];

  const classIds = [...new Set(list.map((p) => p.classId))];
  const subjectIds = [...new Set(list.map((p) => p.subjectId))];
  const pairWhere = list.map((p) => ({ classId: p.classId, subjectId: p.subjectId }));

  const [classes, subjects, offered, counts, batches] = await Promise.all([
    db.schoolClass.findMany({ where: { id: { in: classIds } }, select: { id: true, name: true, level: { select: { sortOrder: true } }, arm: true } }),
    db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true } }),
    db.classSubject.findMany({ where: { OR: pairWhere }, select: { classId: true, subjectId: true, isCompulsory: true } }),
    db.enrollment.groupBy({
      by: ["classId"],
      where: { classId: { in: classIds }, sessionId: term.sessionId, status: "ACTIVE", student: { status: "ACTIVE" } },
      _count: { _all: true },
    }),
    db.subjectResultBatch.findMany({ where: { termId: term.id, OR: pairWhere }, select: { id: true, classId: true, subjectId: true, status: true } }),
  ]);

  const completeCounts = batches.length
    ? await db.resultEntry.groupBy({ by: ["batchId"], where: { batchId: { in: batches.map((b) => b.id) }, total: { not: null } }, _count: { _all: true } })
    : [];

  const classById = new Map(classes.map((c) => [c.id, c]));
  const subjectName = new Map(subjects.map((s) => [s.id, s.name]));
  const studentsIn = new Map(counts.map((c) => [c.classId, c._count._all]));
  const isCompulsory = new Map(offered.map((o) => [`${o.classId}:${o.subjectId}`, o.isCompulsory]));
  const batchOf = new Map(batches.map((b) => [`${b.classId}:${b.subjectId}`, b]));
  const doneOf = new Map(completeCounts.map((c) => [c.batchId, c._count._all]));

  const tasks: EntryTask[] = [];
  for (const p of list) {
    const key = `${p.classId}:${p.subjectId}`;
    if (!isCompulsory.has(key)) continue; // the class no longer offers this subject
    const cls = classById.get(p.classId);
    if (!cls) continue;
    const expected = isCompulsory.get(key)
      ? (studentsIn.get(p.classId) ?? 0)
      : await db.enrollment.count({ where: { classId: p.classId, sessionId: term.sessionId, status: "ACTIVE", student: { status: "ACTIVE" }, subjects: { some: { subjectId: p.subjectId } } } });
    const batch = batchOf.get(key);
    tasks.push({
      classId: p.classId, className: cls.name, subjectId: p.subjectId, subjectName: subjectName.get(p.subjectId) ?? "Subject",
      role: p.role, expected, complete: batch ? (doneOf.get(batch.id) ?? 0) : 0, status: batch?.status ?? "DRAFT",
    });
  }
  return tasks.sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true }) || a.subjectName.localeCompare(b.subjectName));
}
