import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { applyCurriculum, SUBJECTS_BY_STAGE, stageOfLevel } from "@/lib/curriculum";
import { createPins } from "@/lib/pin/generate";
import { computeSubject } from "@/lib/results/calc";
import { loadClassData, type CurrentTerm } from "@/lib/results/class-data";
import { loadCalcConfig } from "@/lib/results/config-store";
import { normalizeName } from "@/lib/utils";
import { isDemoSite } from "./mode";

export { isDemoSite };

// A complete practice school for presentations: teachers, students, scores at every stage of the approval chain,
// published results and working PINs. It only runs on the DEMO site (DEMO_MODE=true), which has its own copy of
// the database, so the real school's records can never be touched. Everything it makes is tagged so "Reset" can
// remove exactly that and nothing else.


export const DEMO_PASSWORD = "Demo-2026!";
const EMAIL_DOMAIN = "demo.giantstepacademy.com.ng";
const ADMISSION_PREFIX = "DEMO/";
const PIN_LABEL = "Demo PINs";
const GUIDE_KEY = "demo.guide";

type Stage = "NURSERY" | "PRIMARY" | "JSS" | "SS";

// Which classes get students, and where each one is left in the approval chain so every step can be shown live.
const CLASSES: { level: string; code: string; stage: Stage; state: "PUBLISHED" | "ADMIN_REVIEW" | "IN_PROGRESS" }[] = [
  { level: "Nursery 2", code: "NUR2", stage: "NURSERY", state: "PUBLISHED" },
  { level: "Basic 4", code: "BAS4", stage: "PRIMARY", state: "PUBLISHED" },
  { level: "Basic 7", code: "BAS7", stage: "JSS", state: "IN_PROGRESS" },
  { level: "SS1", code: "SS1", stage: "SS", state: "PUBLISHED" },
  { level: "SS2", code: "SS2", stage: "SS", state: "ADMIN_REVIEW" },
  { level: "SS3", code: "SS3", stage: "SS", state: "IN_PROGRESS" },
];

const FIRST = ["Tunde", "Amina", "Chinedu", "Zainab", "Emeka", "Halima", "Ifeoma", "Musa", "Ngozi", "Yusuf", "Blessing", "Ibrahim", "Kemi", "Daniel", "Fatima", "Samuel"];
const LAST = ["Ajayi", "Bello", "Okafor", "Abubakar", "Eze", "Yakubu", "Nwosu", "Danjuma", "Adeyemi", "Garba", "Okoro", "Lawal", "Bassey", "Audu", "Ogunleye", "Haruna"];
const FEMALE = new Set(["Amina", "Zainab", "Halima", "Ifeoma", "Ngozi", "Blessing", "Kemi", "Fatima"]);
const STATES = ["Kaduna", "Kano", "Lagos", "Enugu", "Plateau", "Oyo", "Anambra", "Niger", "Bauchi", "Benue"];
const STUDENTS_PER_CLASS = 8;

const FORM_REMARKS = ["A hardworking and well-behaved student.", "Shows steady improvement. Keep it up.", "Very attentive in class.", "Can do better with more focus.", "A pleasure to teach.", "Participates well in class activities."];
const HEAD_REMARKS = ["A good result. Keep it up.", "Well done. Aim higher next term.", "Excellent performance.", "Good effort. Work harder in weak subjects."];
const RATINGS = ["A", "B", "B", "C", "A", "B"] as const;

/** "Cultural & Creative Arts" -> "cultural-creative-arts": the sign-in name of a subject's practice teacher. */
export function subjectSlug(name: string) {
  return name.toLowerCase().replace(/&/g, " ").replace(/\(.*?\)/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Repeatable "random" numbers, so the demo looks the same every time it is loaded.
function seeded(text: string) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export type DemoGuide = {
  loadedAt: string;
  password: string;
  admin: { name: string; email: string };
  teachers: { name: string; email: string; role: string }[];
  students: { name: string; admissionNumber: string; className: string; published: boolean }[];
  pins: string[];
  termId: string;
};

export async function getDemoGuide(): Promise<DemoGuide | null> {
  const row = await db.systemSetting.findUnique({ where: { key: GUIDE_KEY } });
  return (row?.value as DemoGuide | undefined) ?? null;
}

/** Removes everything the demo loader made (and only that). */
export async function clearDemoSchool() {
  if (!isDemoSite()) throw new Error("The demo can only be changed on the demo site.");
  const students = await db.student.findMany({ where: { admissionNumber: { startsWith: ADMISSION_PREFIX } }, select: { id: true } });
  const studentIds = students.map((s) => s.id);
  const enrollments = await db.enrollment.findMany({ where: { studentId: { in: studentIds } }, select: { id: true } });
  const enrollmentIds = enrollments.map((e) => e.id);
  const users = await db.user.findMany({ where: { email: { endsWith: `@${EMAIL_DOMAIN}` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  const pins = await db.pin.findMany({ where: { label: PIN_LABEL }, select: { id: true } });
  const pinIds = pins.map((p) => p.id);

  await db.$transaction(async (tx) => {
    await tx.resultViewSession.deleteMany({ where: { OR: [{ studentId: { in: studentIds } }, { pinId: { in: pinIds } }] } });
    await tx.pinAccessLog.deleteMany({ where: { OR: [{ studentId: { in: studentIds } }, { pinId: { in: pinIds } }] } });
    await tx.pin.deleteMany({ where: { id: { in: pinIds } } });
    await tx.resultEntry.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
    await tx.studentTermSummary.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
    // Batches and sheets of the demo classes (only demo students ever have results in them on the demo site).
    const classIds = (await tx.schoolClass.findMany({ where: { level: { name: { in: CLASSES.map((c) => c.level) } } }, select: { id: true } })).map((c) => c.id);
    const batchIds = (await tx.subjectResultBatch.findMany({ where: { classId: { in: classIds }, entries: { none: {} } }, select: { id: true } })).map((b) => b.id);
    await tx.resultApprovalRecord.deleteMany({ where: { OR: [{ batchId: { in: batchIds } }, { actorId: { in: userIds } }, { sheet: { classId: { in: classIds }, summaries: { none: {} } } }] } });
    await tx.subjectResultBatch.deleteMany({ where: { id: { in: batchIds } } });
    await tx.classResultSheet.deleteMany({ where: { classId: { in: classIds }, summaries: { none: {} } } });
    await tx.studentSubject.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } });
    await tx.enrollment.deleteMany({ where: { id: { in: enrollmentIds } } });
    await tx.student.deleteMany({ where: { id: { in: studentIds } } });
    await tx.subjectAssignment.deleteMany({ where: { teacherId: { in: userIds } } });
    await tx.formTeacherAssignment.deleteMany({ where: { teacherId: { in: userIds } } });
    await tx.user.deleteMany({ where: { id: { in: userIds } } });
    await tx.systemSetting.deleteMany({ where: { key: GUIDE_KEY } });
  }, { timeout: 60_000, maxWait: 10_000 });
}

/** Builds the practice school. Safe to run again: it clears the previous demo first. */
export async function loadDemoSchool(byUserId: string): Promise<DemoGuide> {
  if (!isDemoSite()) throw new Error("The demo can only be loaded on the demo site.");
  await clearDemoSchool();
  await db.$transaction((tx) => applyCurriculum(tx), { timeout: 60_000, maxWait: 10_000 });

  // ── The practice term: 2026/2027, First Term, made current.
  const session = await db.$transaction(async (tx) => {
    await tx.academicSession.updateMany({ where: { isCurrent: true, NOT: { name: "2026/2027" } }, data: { isCurrent: false } });
    const s = await tx.academicSession.upsert({ where: { name: "2026/2027" }, update: { isCurrent: true }, create: { name: "2026/2027", isCurrent: true } });
    for (const [i, name] of ["First Term", "Second Term", "Third Term"].entries()) {
      await tx.term.upsert({ where: { sessionId_name: { sessionId: s.id, name } }, update: {}, create: { sessionId: s.id, name, sortOrder: i + 1 } });
    }
    await tx.term.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
    await tx.term.updateMany({ where: { sessionId: s.id, name: "First Term" }, data: { isCurrent: true, resultsLocked: false, resumptionDate: new Date("2027-01-05T00:00:00Z") } });
    return s;
  });
  const termRow = await db.term.findFirstOrThrow({ where: { sessionId: session.id, name: "First Term" } });
  const term: CurrentTerm = { id: termRow.id, name: termRow.name, sessionId: session.id, sessionName: session.name, resultsLocked: false };

  // Every class and subject starts free: teachers choose their own on the Choose classes page.
  await db.subjectAssignment.deleteMany({ where: { sessionId: session.id } });
  await db.formTeacherAssignment.deleteMany({ where: { sessionId: session.id } });

  // ── Staff: one demo Admin, a practice account per demo class (for its Form Teacher) and per secondary subject.
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const makeUser = (name: string, local: string, role: "ADMIN" | "TEACHER") =>
    db.user.create({
      data: {
        name, email: `${local}@${EMAIL_DOMAIN}`, passwordHash, role, createdById: byUserId,
        ...(role === "TEACHER" ? { teacherProfile: { create: { profileCompleted: true, phone: "0800 000 0000" } } } : {}),
      },
    });
  const admin = await makeUser("Demo Admin", "admin", "ADMIN");

  // A ready-made account per Junior and Senior Secondary subject, for teachers who would rather not sign up. Nothing is
  // assigned: each teacher takes their own classes and subjects. English and Mathematics keep short sign-ins.
  const subjectAccounts: { name: string; email: string; subject: string }[] = [];
  for (const subjectName of [...new Set([...SUBJECTS_BY_STAGE.JSS, ...SUBJECTS_BY_STAGE.SS])]) {
    const local = /^english/i.test(subjectName) ? "english" : subjectName === "Mathematics" ? "maths" : subjectSlug(subjectName);
    if (subjectAccounts.some((a) => a.email.startsWith(`${local}@`))) continue;
    const label = local === "english" ? "English" : subjectName;
    const user = await makeUser(`${label} Teacher`, local, "TEACHER");
    subjectAccounts.push({ name: user.name, email: user.email, subject: label });
  }

  const subjects = new Map((await db.subject.findMany()).map((s) => [s.name, s]));
  const config = await loadCalcConfig((await db.section.findFirstOrThrow()).id);
  const guide: DemoGuide = {
    loadedAt: new Date().toISOString(), password: DEMO_PASSWORD, termId: term.id,
    admin: { name: admin.name, email: admin.email },
    teachers: [],
    students: [],
    pins: [],
  };

  for (const [ci, c] of CLASSES.entries()) {
    const cls = await db.schoolClass.findFirstOrThrow({ where: { level: { name: c.level } }, orderBy: { arm: "asc" }, include: { level: true } });
    const stage = stageOfLevel(cls.level.name) ?? c.stage;
    // Signs the practice term's history (who submitted and reviewed); holds no class until someone chooses one.
    const formTeacher = await makeUser(`${["Mrs.", "Mr."][ci % 2]} ${LAST[(ci * 3 + 5) % LAST.length]}`, `form.${c.code.toLowerCase()}`, "TEACHER");
    guide.teachers.push({ name: formTeacher.name, email: formTeacher.email, role: `Practice account, e.g. as Form Teacher of ${cls.name}` });

    const classSubjects = SUBJECTS_BY_STAGE[stage].map((n) => subjects.get(n)).filter((s): s is NonNullable<typeof s> => !!s);
    const mathsSubject = subjects.get("Mathematics");

    // Students (Tunde Ajayi is always first in SS1A, to match the practice student).
    const enrollments: { id: string; name: string }[] = [];
    for (let i = 0; i < STUDENTS_PER_CLASS; i++) {
      const first = FIRST[(i * 5 + ci * 3) % FIRST.length];
      let last = LAST[(i * 7 + ci * 2) % LAST.length];
      if (first === "Tunde" && last === "Ajayi") last = LAST[(i * 7 + ci * 2 + 1) % LAST.length]; // only SS1A has Tunde Ajayi
      const name = c.code === "SS1" && i === 0 ? "Tunde Ajayi" : `${first} ${last}`;
      const admissionNumber = `${ADMISSION_PREFIX}${c.code}/${String(i + 1).padStart(3, "0")}`;
      const rnd = seeded(admissionNumber);
      const ageBase = { NURSERY: 2022, PRIMARY: 2017, JSS: 2014, SS: 2010 }[stage] + (c.code.endsWith("3") ? -1 : 0);
      const student = await db.student.create({
        data: {
          admissionNumber, fullName: name, normalizedName: normalizeName(name), createdById: byUserId,
          gender: FEMALE.has(name.split(" ")[0]) ? "FEMALE" : "MALE",
          dateOfBirth: new Date(Date.UTC(ageBase - Math.floor(rnd() * 2), Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 27))),
          stateOfOrigin: STATES[Math.floor(rnd() * STATES.length)],
          enrollments: { create: { sessionId: session.id, classId: cls.id } },
        },
        include: { enrollments: true },
      });
      enrollments.push({ id: student.enrollments[0].id, name });
      guide.students.push({ name, admissionNumber, className: cls.name, published: c.state === "PUBLISHED" });
    }

    // Scores for every subject, then each subject's place in the approval chain.
    const sheet = await db.classResultSheet.create({ data: { classId: cls.id, termId: term.id } });
    for (const [si, subject] of classSubjects.entries()) {
      const teacherId = formTeacher.id;
      const isMathsInProgress = c.state === "IN_PROGRESS" && subject.id === mathsSubject?.id;
      // In a class still in progress, Mathematics waits for the Form Teacher and every other subject is half entered,
      // so each subject teacher has scores to finish.
      const isHalfEntered = c.state === "IN_PROGRESS" && subject.id !== mathsSubject?.id;
      const status = isMathsInProgress ? "SUBMITTED" : isHalfEntered ? "DRAFT" : "FORM_TEACHER_APPROVED";
      const now = new Date();
      const batch = await db.subjectResultBatch.create({
        data: {
          classId: cls.id, subjectId: subject.id, termId: term.id, status,
          ...(status !== "DRAFT" ? { submittedById: teacherId, submittedAt: now } : {}),
          ...(status === "FORM_TEACHER_APPROVED" ? { formTeacherReviewedById: formTeacher.id, formTeacherReviewedAt: now } : {}),
        },
      });
      const entries: Prisma.ResultEntryCreateManyInput[] = [];
      for (const [ei, e] of enrollments.entries()) {
        if (isHalfEntered && ei >= 3) continue; // half entered, to show entering scores live
        const rnd = seeded(`${e.id}:${subject.name}`);
        const ability = 0.45 + seeded(e.name + c.code)() * 0.35 + rnd() * 0.15;
        const scores: Record<string, number> = {};
        for (const comp of config.components) scores[comp.id] = Math.min(comp.maxScore, Math.round(comp.maxScore * Math.min(1, ability + (rnd() - 0.5) * 0.2)));
        const r = computeSubject(scores, config.components, config.bands);
        entries.push({ batchId: batch.id, enrollmentId: e.id, scores, total: r.total, grade: r.grade, enteredById: teacherId });
      }
      if (entries.length) await db.resultEntry.createMany({ data: entries });
      if (status !== "DRAFT") {
        await db.resultApprovalRecord.create({ data: { target: "SUBJECT_BATCH", batchId: batch.id, action: "SUBMIT", fromStatus: "DRAFT", toStatus: status === "SUBMITTED" ? "SUBMITTED" : "FORM_TEACHER_APPROVED", actorId: teacherId, actorRole: "TEACHER" } });
      }
      void si;
    }

    // Remarks, attendance and ratings for each student.
    for (const [ei, e] of enrollments.entries()) {
      const rnd = seeded(`remarks:${e.id}`);
      const ratings = Object.fromEntries(["sports", "craftWork", "speechComposition", "drawingPainting", "socialBehaviour", "neatness", "punctuality", "attentiveness"]
        .map((k, ki) => [k, RATINGS[(ei + ki + Math.floor(rnd() * 3)) % RATINGS.length]]));
      await db.studentTermSummary.create({
        data: {
          sheetId: sheet.id, enrollmentId: e.id,
          formTeacherRemark: FORM_REMARKS[(ei + ci) % FORM_REMARKS.length],
          principalRemark: c.state === "IN_PROGRESS" ? null : HEAD_REMARKS[(ei + ci) % HEAD_REMARKS.length],
          attendance: { present: 100 + Math.floor(rnd() * 20), opened: 120 },
          ratings,
        },
      });
    }

    // Move the class sheet along the chain and store the calculated results, as the real steps would.
    if (c.state !== "IN_PROGRESS") {
      const data = await loadClassData(cls.id, term);
      const now = new Date();
      for (const s of data!.summaries) {
        await db.studentTermSummary.update({
          where: { sheetId_enrollmentId: { sheetId: sheet.id, enrollmentId: s.enrollmentId } },
          data: { completeness: s.completeness, subjectsEntered: s.subjectsComplete, subjectsExpected: s.subjectsExpected, totalScore: s.totalScore, average: s.average, overallGrade: s.overallGrade, position: s.position, calculatedAt: now },
        });
      }
      const published = c.state === "PUBLISHED";
      await db.classResultSheet.update({
        where: { id: sheet.id },
        data: { status: published ? "PUBLISHED" : "ADMIN_REVIEW", submittedAt: now, ...(published ? { adminReviewedById: admin.id, adminReviewedAt: now, publishedById: admin.id, publishedAt: now } : {}) },
      });
      await db.resultApprovalRecord.create({ data: { target: "CLASS_SHEET", sheetId: sheet.id, action: "SUBMIT", fromStatus: "DRAFT", toStatus: "ADMIN_REVIEW", actorId: formTeacher.id, actorRole: "TEACHER" } });
      if (published) await db.resultApprovalRecord.create({ data: { target: "CLASS_SHEET", sheetId: sheet.id, action: "PUBLISH", fromStatus: "ADMIN_APPROVED", toStatus: "PUBLISHED", actorId: admin.id, actorRole: "ADMIN" } });
    }
  }

  for (const a of subjectAccounts) guide.teachers.push({ name: a.name, email: a.email, role: `Practice account, e.g. for ${a.subject}` });

  // Working PINs for the parent journey (shown only on the demo guide page).
  guide.pins = await createPins({ count: 10, label: PIN_LABEL, createdById: admin.id });
  await db.systemSetting.upsert({
    where: { key: GUIDE_KEY },
    update: { value: guide as unknown as Prisma.InputJsonValue, updatedById: byUserId },
    create: { key: GUIDE_KEY, value: guide as unknown as Prisma.InputJsonValue, updatedById: byUserId },
  });
  return guide;
}
