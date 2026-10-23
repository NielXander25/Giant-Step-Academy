import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { AuditAction, writeAudit } from "@/lib/audit";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { assertAllowed, canManageAcademicStructure } from "@/lib/permissions/policies";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { planPromotion, type Overrides, type Plan } from "./plan";

type Actor = { id: string; role: Role; canCreateAdmins?: boolean };

async function loadData(fromSessionId: string, toSessionId: string) {
  const [from, to] = await Promise.all([
    db.academicSession.findUnique({ where: { id: fromSessionId }, select: { id: true, name: true } }),
    db.academicSession.findUnique({ where: { id: toSessionId }, select: { id: true, name: true } }),
  ]);
  if (!from || !to) throw new NotFoundError("One of the sessions could not be found.");
  if (from.id === to.id) throw new ConflictError("Choose two different sessions: the year being finished and the new one.");

  const [levels, classes, enrollments, inNew, lastTerm] = await Promise.all([
    db.classLevel.findMany({ select: { id: true, name: true, nextLevelId: true, isFinal: true } }),
    db.schoolClass.findMany({ select: { id: true, name: true, levelId: true, arm: true, isActive: true } }),
    db.enrollment.findMany({ where: { sessionId: from.id, status: "ACTIVE" }, select: { id: true, studentId: true, classId: true, isRepeater: true, student: { select: { status: true } } } }),
    db.enrollment.findMany({ where: { sessionId: to.id }, select: { studentId: true } }),
    db.term.findFirst({ where: { sessionId: from.id }, orderBy: { sortOrder: "desc" }, select: { id: true, name: true } }),
  ]);
  const published = lastTerm
    ? new Set((await db.classResultSheet.findMany({ where: { termId: lastTerm.id, status: "PUBLISHED" }, select: { classId: true } })).map((s) => s.classId))
    : new Set<string>();

  return {
    from, to, levels, classes, lastTerm, published,
    enrollments: enrollments.map((e) => ({ id: e.id, studentId: e.studentId, classId: e.classId, isRepeater: e.isRepeater, studentActive: e.student.status === "ACTIVE" })),
    alreadyInNewSession: new Set(inNew.map((e) => e.studentId)),
  };
}

/** What promotion WOULD do. Changes nothing. */
export async function previewPromotion(fromSessionId: string, toSessionId: string, overrides: Overrides = {}) {
  const d = await loadData(fromSessionId, toSessionId);
  const plan = planPromotion({ levels: d.levels, classes: d.classes, enrollments: d.enrollments, alreadyInNewSession: d.alreadyInNewSession, overrides });
  const unpublished = plan.classes.filter((c) => c.eligible > 0 && !d.published.has(c.sourceClassId)).map((c) => c.sourceClassName);
  return { from: d.from, to: d.to, lastTermName: d.lastTerm?.name ?? null, plan, unpublished, publishedClassIds: [...d.published] };
}

export type PromotionSummary = Plan["totals"] & { createdClasses: string[] };

/** Does it, all at once or not at all. Safe to run twice: students already in the new session are never touched again. */
export async function runPromotion(user: Actor, input: { fromSessionId: string; toSessionId: string; overrides: Overrides; allowUnpublished: boolean }): Promise<PromotionSummary> {
  assertAllowed(canManageAcademicStructure(user), "Only an Admin can promote students.");
  const d = await loadData(input.fromSessionId, input.toSessionId);
  const plan = planPromotion({ levels: d.levels, classes: d.classes, enrollments: d.enrollments, alreadyInNewSession: d.alreadyInNewSession, overrides: input.overrides });

  if (plan.operations.length === 0) throw new ConflictError("There is nobody to promote. Everyone eligible has already been moved, or the destinations are blocked.");
  const unpublished = plan.classes.filter((c) => c.eligible > 0 && !d.published.has(c.sourceClassId)).map((c) => c.sourceClassName);
  if (unpublished.length && !input.allowUnpublished) {
    throw new ConflictError(`${d.lastTerm?.name ?? "The last term"}'s results are not published yet for: ${unpublished.join(", ")}. Publish them first, or choose to continue anyway.`);
  }

  try {
    await db.$transaction(async (tx) => {
      // 1) classes that do not exist yet
      const created = new Map<string, string>();
      for (const nc of plan.newClasses) {
        const existing = (await tx.schoolClass.findUnique({ where: { levelId_arm: { levelId: nc.levelId, arm: nc.arm } } })) ?? (await tx.schoolClass.findUnique({ where: { name: nc.name } }));
        created.set(nc.key, existing ? existing.id : (await tx.schoolClass.create({ data: { levelId: nc.levelId, arm: nc.arm, name: nc.name } })).id);
      }
      // 2) the new year's enrollments
      const moving = plan.operations.filter((o) => o.kind !== "GRADUATE");
      if (moving.length) {
        await tx.enrollment.createMany({
          data: moving.map((o) => ({
            studentId: o.studentId, sessionId: input.toSessionId, classId: o.targetClassId ?? created.get(o.createKey!)!,
            promotedFromEnrollmentId: o.enrollmentId, status: "ACTIVE" as const, isRepeater: false,
          })),
        });
      }
      // 3) close the old year's enrollments
      const ids = (k: string) => plan.operations.filter((o) => o.kind === k).map((o) => o.enrollmentId);
      if (ids("PROMOTE").length) await tx.enrollment.updateMany({ where: { id: { in: ids("PROMOTE") } }, data: { status: "PROMOTED" } });
      if (ids("REPEAT").length) await tx.enrollment.updateMany({ where: { id: { in: ids("REPEAT") } }, data: { status: "REPEATED" } });
      const grads = plan.operations.filter((o) => o.kind === "GRADUATE");
      if (grads.length) {
        await tx.enrollment.updateMany({ where: { id: { in: grads.map((g) => g.enrollmentId) } }, data: { status: "GRADUATED" } });
        await tx.student.updateMany({ where: { id: { in: grads.map((g) => g.studentId) } }, data: { status: "GRADUATED" } });
      }
    }, { timeout: 60_000, maxWait: 10_000 });
  } catch (error) {
    if (isUniqueViolation(error)) throw new ConflictError("Some students were moved by someone else while you were working. Reload the page and check again.");
    throw error;
  }

  const summary: PromotionSummary = { ...plan.totals, createdClasses: plan.newClasses.map((c) => c.name) };
  await writeAudit({
    actorId: user.id, actorRole: user.role, action: AuditAction.PROMOTION_RUN, entityType: "AcademicSession", entityId: input.toSessionId,
    metadata: { from: d.from.name, to: d.to.name, promoted: plan.totals.promote, repeated: plan.totals.repeat, graduated: plan.totals.graduate, notPromoted: plan.totals.notPromoted, newClasses: summary.createdClasses.length },
  });
  return summary;
}
