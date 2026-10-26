import type { Prisma, ResultStatus, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { AuditAction, writeAudit } from "@/lib/audit";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import {
  assertAllowed, canAdminReview, canEditFormTeacherRemarks, canEditPrincipalRemarks, canEnterScores, canFormTeacherReview,
  canPublishResults, canReopenSubject, canSubmitClassSheet, isFormTeacherOf, isTeacher, type TeacherScope,
} from "@/lib/permissions/policies";
import { computeSubject, round2, type StudentSummary, type SubjectScores } from "./calc";
import { getCurrentTerm, loadClassData, loadRoster, type CurrentTerm } from "./class-data";
import { loadCalcConfig } from "./config-store";
import { parseRatings, type Attendance, type Ratings } from "./report-card";
import { batchFrom, batchTransition, canEditBatch, sheetTransition, type BatchAction, type SheetAction } from "./workflow";

// All the rules for entering, submitting, reviewing and publishing results.
// Every function checks permissions itself (never trusting the browser), works on the CURRENT term,
// changes status only through a "claim" (an update that matches the expected old status), and
// writes an approval record plus an audit entry. Run inside the transaction where they must stay together.

type Actor = { id: string; role: Role; canCreateAdmins?: boolean };
type Tx = Prisma.TransactionClient;

const TX_OPTIONS = { timeout: 30_000, maxWait: 10_000 };

async function requireTerm(): Promise<CurrentTerm> {
  const term = await getCurrentTerm();
  if (!term) throw new ConflictError("An Admin must set the current term first.");
  return term;
}

/** For changes to scores and remarks: refused once an Admin has locked the term. */
async function requireOpenTerm(): Promise<CurrentTerm> {
  const term = await requireTerm();
  if (term.resultsLocked) throw new ConflictError("Results for this term are locked.");
  return term;
}

const sheetFor = (tx: Tx, classId: string, termId: string) =>
  tx.classResultSheet.upsert({ where: { classId_termId: { classId, termId } }, update: {}, create: { classId, termId } });

type RecordInput = {
  target: "SUBJECT_BATCH" | "CLASS_SHEET";
  batchId?: string;
  sheetId?: string;
  action: "SUBMIT" | "APPROVE" | "REJECT" | "REQUEST_CORRECTION" | "PUBLISH" | "UNPUBLISH";
  from?: string | null;
  to: string;
  actor: Actor;
  comment?: string | null;
};
const record = (tx: Tx, r: RecordInput) =>
  tx.resultApprovalRecord.create({
    data: {
      target: r.target, batchId: r.batchId, sheetId: r.sheetId, action: r.action,
      fromStatus: (r.from ?? null) as ResultStatus | null, toStatus: r.to as ResultStatus,
      actorId: r.actor.id, actorRole: r.actor.role, comment: r.comment ?? null,
    },
  });

const audit = (user: Actor, action: (typeof AuditAction)[keyof typeof AuditAction], entityType: string, entityId: string, metadata?: Record<string, string | number | boolean | null>) =>
  writeAudit({ actorId: user.id, actorRole: user.role, action, entityType, entityId, metadata });

function requireConfig(config: { components: unknown[]; bands: unknown[] }) {
  if (config.components.length === 0) throw new ConflictError("Score components have not been set up yet. Ask an Admin to set them up first.");
  if (config.bands.length === 0) throw new ConflictError("Grading has not been set up yet. Ask an Admin to set it up first.");
}

// ─── Entering scores ───

export async function saveScores(
  user: Actor,
  scope: TeacherScope,
  input: { classId: string; subjectId: string; rows: { enrollmentId: string; scores: Record<string, number | null>; remark?: string }[] },
) {
  assertAllowed(canEnterScores(user, scope, input), "You are not assigned to this subject in this class.");
  const term = await requireOpenTerm();
  const roster = await loadRoster(input.classId, input.subjectId, term);
  if (!roster) throw new ConflictError("That subject is not offered by this class.");
  const config = await loadCalcConfig(roster.sectionId);
  requireConfig(config);

  const students = new Map(roster.students.map((s) => [s.enrollmentId, s]));
  const known = new Set(config.components.map((c) => c.id));
  const problems: string[] = [];

  const rows = input.rows.map((row) => {
    const student = students.get(row.enrollmentId);
    if (!student) throw new ForbiddenError("A student in this list does not belong to this subject and class.");
    if (Object.keys(row.scores).some((k) => !known.has(k))) throw new ConflictError("The score components changed. Reload the page and try again.");

    const scores: Record<string, number | null> = {};
    for (const c of config.components) scores[c.id] = row.scores[c.id] == null ? null : round2(row.scores[c.id] as number);
    const result = computeSubject(scores, config.components, config.bands);
    if (result.errors.length) problems.push(`${student.fullName}: ${result.errors[0]}`);
    return { enrollmentId: row.enrollmentId, scores, result, remark: row.remark?.trim() || null };
  });
  if (problems.length) {
    throw new ConflictError(problems.slice(0, 3).join(" · ") + (problems.length > 3 ? ` (and ${problems.length - 3} more)` : ""));
  }

  await db.$transaction(async (tx) => {
    const sheet = await sheetFor(tx, input.classId, term.id);
    const batch = await tx.subjectResultBatch.upsert({
      where: { classId_subjectId_termId: { classId: input.classId, subjectId: input.subjectId, termId: term.id } },
      update: {},
      create: { classId: input.classId, subjectId: input.subjectId, termId: term.id },
    });
    // Touching the row while it is still open locks it for this transaction, so a submit cannot slip in mid-save.
    const open = await tx.subjectResultBatch.updateMany({ where: { id: batch.id, status: { in: batchFrom("SUBMIT") } }, data: { updatedAt: new Date() } });
    if (open.count !== 1 || !canEditBatch(batch.status, sheet.status)) throw new ConflictError("These results are no longer open for editing.");

    for (const r of rows) {
      const nothing = Object.values(r.scores).every((v) => v === null) && !r.remark;
      if (nothing) {
        await tx.resultEntry.deleteMany({ where: { batchId: batch.id, enrollmentId: r.enrollmentId } });
        continue;
      }
      const data = { scores: r.scores as Prisma.InputJsonValue, total: r.result.total, grade: r.result.grade, remark: r.remark, enteredById: user.id };
      await tx.resultEntry.upsert({
        where: { batchId_enrollmentId: { batchId: batch.id, enrollmentId: r.enrollmentId } },
        update: data,
        create: { batchId: batch.id, enrollmentId: r.enrollmentId, ...data },
      });
    }
  }, TX_OPTIONS);

  await audit(user, AuditAction.RESULT_EDITED, "SubjectResultBatch", `${input.classId}:${input.subjectId}`, { rows: rows.length, term: term.name });
  return { saved: rows.length };
}

export async function submitSubject(user: Actor, scope: TeacherScope, input: { classId: string; subjectId: string }) {
  assertAllowed(canEnterScores(user, scope, input), "You are not assigned to this subject in this class.");
  const term = await requireOpenTerm();
  const roster = await loadRoster(input.classId, input.subjectId, term);
  if (!roster) throw new ConflictError("That subject is not offered by this class.");
  if (roster.students.length === 0) throw new ConflictError("There are no students in this class yet.");
  const config = await loadCalcConfig(roster.sectionId);
  requireConfig(config);

  // A Form Teacher's own entries skip the Form Teacher review and go straight to the Admin stage.
  const byFormTeacher = isTeacher(user) && isFormTeacherOf(scope, input.classId);
  const action: BatchAction = byFormTeacher ? "SUBMIT_AS_FORM_TEACHER" : "SUBMIT";

  const status = await db.$transaction(async (tx) => {
    const sheet = await sheetFor(tx, input.classId, term.id);
    if (sheet.status !== "DRAFT") throw new ConflictError("This class's results have already gone to the Admin.");
    const batch = await tx.subjectResultBatch.findUnique({
      where: { classId_subjectId_termId: { classId: input.classId, subjectId: input.subjectId, termId: term.id } },
      include: { entries: true },
    });
    if (!batch) throw new ConflictError("Enter and save the scores first.");
    const to = batchTransition(batch.status, action);
    if (!to) throw new ConflictError("These results have already been submitted.");

    // Every student must have every score, checked against the stored scores right now.
    const entryOf = new Map(batch.entries.map((e) => [e.enrollmentId, e]));
    const incomplete = roster.students.filter((s) => {
      const e = entryOf.get(s.enrollmentId);
      return !e || computeSubject(e.scores as SubjectScores, config.components, config.bands).status !== "COMPLETE";
    });
    if (incomplete.length) {
      throw new ConflictError(`${incomplete.length} student${incomplete.length === 1 ? " is" : "s are"} still missing scores, starting with ${incomplete[0].fullName}.`);
    }

    const now = new Date();
    const claimed = await tx.subjectResultBatch.updateMany({
      where: { id: batch.id, status: batch.status },
      data: {
        status: to, submittedById: user.id, submittedAt: now, lastRejectionReason: null,
        ...(byFormTeacher ? { formTeacherReviewedById: user.id, formTeacherReviewedAt: now } : {}),
      },
    });
    if (claimed.count !== 1) throw new ConflictError("These results have already been submitted.");
    await record(tx, {
      target: "SUBJECT_BATCH", batchId: batch.id, action: "SUBMIT", from: batch.status, to, actor: user,
      comment: byFormTeacher ? "Entered by the Form Teacher, so the Form Teacher review step is skipped." : null,
    });
    return to;
  }, TX_OPTIONS);

  await audit(user, AuditAction.RESULT_SUBMITTED, "SubjectResultBatch", `${input.classId}:${input.subjectId}`, { status, term: term.name });
  return { status };
}

// ─── Form Teacher review of a subject ───

export async function reviewSubject(
  user: Actor,
  scope: TeacherScope,
  input: { classId: string; subjectId: string; decision: "APPROVE" | "REJECT"; reason?: string },
) {
  const term = await requireTerm();
  if (input.decision === "REJECT" && !input.reason?.trim()) throw new ConflictError("Give a short reason so the teacher knows what to correct.");

  const to = await db.$transaction(async (tx) => {
    const sheet = await sheetFor(tx, input.classId, term.id);
    if (sheet.status !== "DRAFT") throw new ConflictError("This class's results have already gone to the Admin.");
    const batch = await tx.subjectResultBatch.findUnique({
      where: { classId_subjectId_termId: { classId: input.classId, subjectId: input.subjectId, termId: term.id } },
    });
    if (!batch) throw new NotFoundError("Those results could not be found.");
    assertAllowed(canFormTeacherReview(user, scope, { classId: input.classId, submittedById: batch.submittedById }), "Only the class's Form Teacher can review this, and never their own submission.");

    const action: BatchAction = input.decision;
    const next = batchTransition(batch.status, action);
    if (!next) throw new ConflictError("These results are not waiting for review.");
    const now = new Date();
    const claimed = await tx.subjectResultBatch.updateMany({
      where: { id: batch.id, status: "SUBMITTED" },
      data: { status: next, formTeacherReviewedById: user.id, formTeacherReviewedAt: now, lastRejectionReason: input.decision === "REJECT" ? input.reason!.trim() : null },
    });
    if (claimed.count !== 1) throw new ConflictError("These results are not waiting for review.");
    await record(tx, { target: "SUBJECT_BATCH", batchId: batch.id, action: input.decision === "APPROVE" ? "APPROVE" : "REJECT", from: batch.status, to: next, actor: user, comment: input.reason?.trim() ?? null });
    return next;
  }, TX_OPTIONS);

  await audit(user, input.decision === "APPROVE" ? AuditAction.RESULT_FORM_TEACHER_APPROVED : AuditAction.RESULT_REJECTED, "SubjectResultBatch", `${input.classId}:${input.subjectId}`);
  return { status: to };
}

/** A subject teacher takes back their own submission to fix a mistake, as long as the Form Teacher has not reviewed it yet. */
export async function takeBackSubject(user: Actor, scope: TeacherScope, input: { classId: string; subjectId: string }) {
  assertAllowed(canEnterScores(user, scope, input), "You are not assigned to this subject in this class.");
  const term = await requireOpenTerm();

  await db.$transaction(async (tx) => {
    const sheet = await sheetFor(tx, input.classId, term.id);
    if (sheet.status !== "DRAFT") throw new ConflictError("This class's results have already gone to the Admin. Ask the Admin to send this subject back.");
    const batch = await tx.subjectResultBatch.findUnique({
      where: { classId_subjectId_termId: { classId: input.classId, subjectId: input.subjectId, termId: term.id } },
    });
    const to = batch ? batchTransition(batch.status, "TAKE_BACK") : null;
    if (!batch || !to) throw new ConflictError("Only results still waiting for the Form Teacher can be taken back. Ask the Form Teacher to reopen them.");
    if (batch.submittedById !== user.id) throw new ForbiddenError("Only the teacher who submitted these results can take them back.");
    const claimed = await tx.subjectResultBatch.updateMany({ where: { id: batch.id, status: batch.status }, data: { status: to } });
    if (claimed.count !== 1) throw new ConflictError("These results have just been reviewed. Reload the page.");
    await record(tx, { target: "SUBJECT_BATCH", batchId: batch.id, action: "REQUEST_CORRECTION", from: batch.status, to, actor: user, comment: "Taken back by the teacher to correct." });
  }, TX_OPTIONS);

  await audit(user, AuditAction.RESULT_REOPENED, "SubjectResultBatch", `${input.classId}:${input.subjectId}`, { takenBack: true });
  return { status: "DRAFT" as const };
}

/** The Form Teacher takes an approved subject back for correction, as long as the class has not gone to the Admin. */
export async function reopenSubject(user: Actor, scope: TeacherScope, input: { classId: string; subjectId: string }) {
  assertAllowed(canReopenSubject(user, scope, input.classId), "Only the class's Form Teacher can reopen a subject.");
  const term = await requireOpenTerm();

  await db.$transaction(async (tx) => {
    const sheet = await sheetFor(tx, input.classId, term.id);
    if (sheet.status !== "DRAFT") throw new ConflictError("This class's results have already gone to the Admin.");
    const batch = await tx.subjectResultBatch.findUnique({
      where: { classId_subjectId_termId: { classId: input.classId, subjectId: input.subjectId, termId: term.id } },
    });
    const to = batch ? batchTransition(batch.status, "REOPEN") : null;
    if (!batch || !to) throw new ConflictError("Only an approved subject can be reopened.");
    const claimed = await tx.subjectResultBatch.updateMany({ where: { id: batch.id, status: batch.status }, data: { status: to } });
    if (claimed.count !== 1) throw new ConflictError("Only an approved subject can be reopened.");
    await record(tx, { target: "SUBJECT_BATCH", batchId: batch.id, action: "REQUEST_CORRECTION", from: batch.status, to, actor: user, comment: "Reopened by the Form Teacher." });
  }, TX_OPTIONS);

  await audit(user, AuditAction.RESULT_REOPENED, "SubjectResultBatch", `${input.classId}:${input.subjectId}`);
  return { reopened: true };
}

// ─── Remarks ───

type RemarkRow = { enrollmentId: string; remark: string; ratings?: Ratings; attendance?: Attendance };

const REMARK_FIELD = { FORM_TEACHER: "formTeacherRemark", PRINCIPAL: "principalRemark", SUPERVISOR: "supervisorRemark" } as const;

export async function saveRemarks(
  user: Actor,
  scope: TeacherScope,
  input: { classId: string; kind: "FORM_TEACHER" | "PRINCIPAL" | "SUPERVISOR"; remarks: RemarkRow[] },
) {
  if (input.kind === "FORM_TEACHER") assertAllowed(canEditFormTeacherRemarks(user, scope, input.classId), "Only the class's Form Teacher can write these remarks.");
  else assertAllowed(canEditPrincipalRemarks(user), "Only an Admin can write the principal's and supervisor's remarks.");
  const term = input.kind === "FORM_TEACHER" ? await requireOpenTerm() : await requireTerm();

  const ids = input.remarks.map((r) => r.enrollmentId);
  const valid = await db.enrollment.count({ where: { id: { in: ids }, classId: input.classId, sessionId: term.sessionId } });
  if (valid !== new Set(ids).size) throw new ForbiddenError("A student in this list does not belong to this class.");
  const field = REMARK_FIELD[input.kind];

  await db.$transaction(async (tx) => {
    const sheet = await sheetFor(tx, input.classId, term.id);
    if (input.kind === "FORM_TEACHER" && sheet.status !== "DRAFT") throw new ConflictError("This class's results have already gone to the Admin.");
    if (input.kind !== "FORM_TEACHER" && sheet.status === "PUBLISHED") throw new ConflictError("Unpublish the results before changing remarks.");
    for (const r of input.remarks) {
      const data: Prisma.StudentTermSummaryUncheckedUpdateInput = { [field]: r.remark.trim() || null };
      // Ratings and attendance belong to the Form Teacher, like their remark.
      if (input.kind === "FORM_TEACHER" && r.ratings) data.ratings = parseRatings(r.ratings) as Prisma.InputJsonValue;
      if (input.kind === "FORM_TEACHER" && r.attendance) data.attendance = r.attendance as Prisma.InputJsonValue;
      await tx.studentTermSummary.upsert({
        where: { sheetId_enrollmentId: { sheetId: sheet.id, enrollmentId: r.enrollmentId } },
        update: data,
        create: { ...(data as Prisma.StudentTermSummaryUncheckedCreateInput), sheetId: sheet.id, enrollmentId: r.enrollmentId },
      });
    }
  }, TX_OPTIONS);

  await audit(user, AuditAction.RESULT_EDITED, "ClassResultSheet", input.classId, { remarks: input.kind, count: input.remarks.length });
  return { saved: input.remarks.length };
}

// ─── The class sheet ───

async function storeSummaries(tx: Tx, sheetId: string, summaries: StudentSummary[]) {
  const now = new Date();
  for (const s of summaries) {
    const data = {
      completeness: s.completeness, subjectsEntered: s.subjectsComplete, subjectsExpected: s.subjectsExpected,
      totalScore: s.totalScore, average: s.average, overallGrade: s.overallGrade, position: s.position, calculatedAt: now,
    };
    await tx.studentTermSummary.upsert({
      where: { sheetId_enrollmentId: { sheetId, enrollmentId: s.enrollmentId } },
      update: data, // remarks are left alone
      create: { sheetId, enrollmentId: s.enrollmentId, ...data },
    });
  }
}

/** Why a class cannot be sent to the Admin yet (empty = ready). */
export function sheetBlockers(data: NonNullable<Awaited<ReturnType<typeof loadClassData>>>): string[] {
  const blockers: string[] = [];
  if (data.students.length === 0) return ["There are no students in this class yet."];
  const waiting = data.subjects.filter((s) => s.expectedStudents > 0 && s.batch?.status !== "FORM_TEACHER_APPROVED").map((s) => s.name);
  if (waiting.length) blockers.push(`Subjects not approved yet: ${waiting.join(", ")}.`);
  const missing = data.summaries.filter((s) => s.completeness !== "COMPLETE");
  if (missing.length && !waiting.length) {
    const first = data.students.find((s) => s.enrollmentId === missing[0].enrollmentId)?.fullName;
    blockers.push(`${missing.length} student${missing.length === 1 ? " has" : "s have"} missing scores, starting with ${first}.`);
  }
  return blockers;
}

export async function submitSheet(user: Actor, scope: TeacherScope, input: { classId: string }) {
  assertAllowed(canSubmitClassSheet(user, scope, input.classId), "Only the class's Form Teacher can send the class to the Admin.");
  const term = await requireOpenTerm();
  const data = await loadClassData(input.classId, term);
  if (!data) throw new NotFoundError("That class could not be found.");
  const blockers = sheetBlockers(data);
  if (blockers.length) throw new ConflictError(blockers.join(" "));

  await db.$transaction(async (tx) => {
    const sheet = await sheetFor(tx, input.classId, term.id);
    const to = sheetTransition(sheet.status, "SUBMIT");
    if (!to) throw new ConflictError("This class has already been sent to the Admin.");
    const claimed = await tx.classResultSheet.updateMany({ where: { id: sheet.id, status: sheet.status }, data: { status: to, submittedAt: new Date(), rejectionReason: null } });
    if (claimed.count !== 1) throw new ConflictError("This class has already been sent to the Admin.");
    await storeSummaries(tx, sheet.id, data.summaries);
    await record(tx, { target: "CLASS_SHEET", sheetId: sheet.id, action: "SUBMIT", from: sheet.status, to, actor: user });
  }, TX_OPTIONS);

  await audit(user, AuditAction.RESULT_SHEET_SUBMITTED, "ClassResultSheet", input.classId, { term: term.name });
  return { status: "ADMIN_REVIEW" as const };
}

export async function adminReviewSheet(
  user: Actor,
  input: { classId: string; decision: "APPROVE" | "RETURN" | "WITHDRAW"; reason?: string; subjectIds?: string[] },
) {
  const term = await requireTerm();
  const action: SheetAction = input.decision;

  const result = await db.$transaction(async (tx) => {
    const sheet = await tx.classResultSheet.findUnique({ where: { classId_termId: { classId: input.classId, termId: term.id } } });
    if (!sheet) throw new NotFoundError("That class has not been sent for review.");
    const to = sheetTransition(sheet.status, action);
    if (!to) throw new ConflictError("That is not possible at this stage.");

    const lastSubmit = await tx.resultApprovalRecord.findFirst({ where: { sheetId: sheet.id, action: "SUBMIT" }, orderBy: { createdAt: "desc" }, select: { actorId: true } });
    assertAllowed(canAdminReview(user, { submittedById: lastSubmit?.actorId ?? null }), "You cannot review results you sent in yourself, or you are not an Admin.");

    const now = new Date();
    const claimed = await tx.classResultSheet.updateMany({
      where: { id: sheet.id, status: sheet.status },
      data: {
        status: to, adminReviewedById: user.id, adminReviewedAt: now, rejectionReason: input.decision === "RETURN" ? input.reason?.trim() ?? null : null,
        // Returning published results for correction takes them away from parents until they are published again.
        ...(sheet.status === "PUBLISHED" ? { publishedAt: null, publishedById: null } : {}),
      },
    });
    if (claimed.count !== 1) throw new ConflictError("That is not possible at this stage.");

    if (input.decision === "RETURN") {
      const reason = input.reason?.trim();
      const subjectIds = [...new Set(input.subjectIds ?? [])];
      if (!reason || subjectIds.length === 0) throw new ConflictError("Choose the subjects to send back and give a reason.");
      const batches = await tx.subjectResultBatch.findMany({
        where: { classId: input.classId, termId: term.id, subjectId: { in: subjectIds }, status: "FORM_TEACHER_APPROVED" },
        select: { id: true },
      });
      if (batches.length !== subjectIds.length) throw new ConflictError("One of the chosen subjects is not in an approved state.");
      await tx.subjectResultBatch.updateMany({ where: { id: { in: batches.map((b) => b.id) } }, data: { status: "FORM_TEACHER_REJECTED", lastRejectionReason: reason } });
      for (const b of batches) {
        await record(tx, { target: "SUBJECT_BATCH", batchId: b.id, action: "REJECT", from: "FORM_TEACHER_APPROVED", to: "FORM_TEACHER_REJECTED", actor: user, comment: reason });
      }
    }
    await record(tx, {
      target: "CLASS_SHEET", sheetId: sheet.id, from: sheet.status, to, actor: user, comment: input.reason?.trim() ?? null,
      action: input.decision === "APPROVE" ? "APPROVE" : "REQUEST_CORRECTION",
    });
    return to;
  }, TX_OPTIONS);

  await audit(user, input.decision === "APPROVE" ? AuditAction.RESULT_ADMIN_APPROVED : AuditAction.RESULT_REJECTED, "ClassResultSheet", input.classId, { decision: input.decision });
  return { status: result };
}

export async function publishSheet(user: Actor, input: { classId: string }) {
  assertAllowed(canPublishResults(user), "Only an Admin can publish results.");
  const term = await requireTerm();
  const data = await loadClassData(input.classId, term);
  if (!data) throw new NotFoundError("That class could not be found.");
  const unfinished = data.summaries.filter((s) => s.completeness !== "COMPLETE");
  if (unfinished.length) throw new ConflictError(`${unfinished.length} student${unfinished.length === 1 ? " has" : "s have"} incomplete results, so this class cannot be published.`);

  await db.$transaction(async (tx) => {
    const sheet = await tx.classResultSheet.findUnique({ where: { classId_termId: { classId: input.classId, termId: term.id } } });
    const to = sheet ? sheetTransition(sheet.status, "PUBLISH") : null;
    if (!sheet || !to) throw new ConflictError("Only approved results can be published.");
    const claimed = await tx.classResultSheet.updateMany({ where: { id: sheet.id, status: sheet.status }, data: { status: to, publishedAt: new Date(), publishedById: user.id } });
    if (claimed.count !== 1) throw new ConflictError("Only approved results can be published.");
    await storeSummaries(tx, sheet.id, data.summaries); // the final, stored copy parents will see
    await record(tx, { target: "CLASS_SHEET", sheetId: sheet.id, action: "PUBLISH", from: sheet.status, to, actor: user });
  }, TX_OPTIONS);

  await audit(user, AuditAction.RESULT_PUBLISHED, "ClassResultSheet", input.classId, { term: term.name });
  return { status: "PUBLISHED" as const };
}

export async function unpublishSheet(user: Actor, input: { classId: string; reason: string }) {
  assertAllowed(canPublishResults(user), "Only an Admin can unpublish results.");
  const term = await requireTerm();

  await db.$transaction(async (tx) => {
    const sheet = await tx.classResultSheet.findUnique({ where: { classId_termId: { classId: input.classId, termId: term.id } } });
    const to = sheet ? sheetTransition(sheet.status, "UNPUBLISH") : null;
    if (!sheet || !to) throw new ConflictError("Only published results can be unpublished.");
    const claimed = await tx.classResultSheet.updateMany({ where: { id: sheet.id, status: sheet.status }, data: { status: to, publishedAt: null, publishedById: null } });
    if (claimed.count !== 1) throw new ConflictError("Only published results can be unpublished.");
    await record(tx, { target: "CLASS_SHEET", sheetId: sheet.id, action: "UNPUBLISH", from: sheet.status, to, actor: user, comment: input.reason });
  }, TX_OPTIONS);

  await audit(user, AuditAction.RESULT_UNPUBLISHED, "ClassResultSheet", input.classId, { term: term.name });
  return { status: "ADMIN_APPROVED" as const };
}
