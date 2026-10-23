import type { PinAccessOutcome, PinStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { AuditAction, writeAudit } from "@/lib/audit";
import { normalizeName } from "@/lib/utils";
import { normalizeAdmissionNumber } from "@/lib/students/normalize";
import { normalizePin } from "./format";
import { hashPin } from "./hash";
import { effectivePinStatus, expiryFrom } from "./lifecycle";
import { ipThrottled, studentThrottled } from "./throttle";
import { hashViewToken, newViewToken, viewSessionExpiry } from "./view-session";

export type AccessInput = {
  studentName: string;
  admissionNumber: string;
  pin: string;
  termId: string;
  ipHash: string | null;
  userAgent: string | null;
};

/** INVALID covers every "details do not match / PIN cannot be used" case on purpose, so nobody can probe for valid PINs or students. */
export type AccessResult =
  | { ok: true; token: string; attemptsUsed: number; maxUses: number }
  | { ok: false; reason: "INVALID" | "RATE_LIMITED" | "NOT_PUBLISHED" };

/**
 * The only place a result PIN is ever used. In order:
 *   1. rate limits  2. the student (exact name + admission number)  3. the PIN  4. the PIN is still usable
 *   5. the result is published  6. use up ONE attempt and open a view pass, together or not at all.
 * Wrong details never use up an attempt. Every outcome is logged.
 */
export async function attemptAccess(input: AccessInput, now: Date = new Date()): Promise<AccessResult> {
  const log = (outcome: PinAccessOutcome, extra: { pinId?: string | null; studentId?: string | null; pinStatus?: PinStatus | null } = {}) =>
    db.pinAccessLog.create({
      data: {
        outcome, pinId: extra.pinId ?? null, studentId: extra.studentId ?? null, termId: input.termId,
        pinStatusAtTime: extra.pinStatus ?? null, ipHash: input.ipHash, userAgent: input.userAgent?.slice(0, 200) ?? null,
      },
    });

  if (await ipThrottled(input.ipHash, now)) {
    await log("RATE_LIMITED");
    return { ok: false, reason: "RATE_LIMITED" };
  }

  const student = await db.student.findUnique({ where: { admissionNumber: normalizeAdmissionNumber(input.admissionNumber) } });
  const matched = student && student.normalizedName === normalizeName(input.studentName) ? student : null;

  if (matched && (await studentThrottled(matched.id, now))) {
    await log("RATE_LIMITED", { studentId: matched.id });
    return { ok: false, reason: "RATE_LIMITED" };
  }

  const pinText = normalizePin(input.pin);
  const pin = pinText ? await db.pin.findUnique({ where: { pinHash: hashPin(pinText) } }) : null;

  if (!matched || !pin) {
    await log("INVALID_CREDENTIALS", { studentId: matched?.id, pinId: pin?.id });
    return { ok: false, reason: "INVALID" };
  }

  const state = effectivePinStatus(pin, now);
  if (state !== "ACTIVE") {
    if (pin.status === "ACTIVE") {
      // The stored status lagged behind; record the truth now.
      await db.pin.updateMany({ where: { id: pin.id, status: "ACTIVE" }, data: { status: state } });
      await writeAudit({ action: state === "EXPIRED" ? AuditAction.PIN_EXPIRED : AuditAction.PIN_EXHAUSTED, entityType: "Pin", entityId: pin.id });
    }
    await log(state === "DISABLED" ? "PIN_DISABLED" : state === "EXPIRED" ? "PIN_EXPIRED" : "PIN_EXHAUSTED", { studentId: matched.id, pinId: pin.id, pinStatus: state });
    return { ok: false, reason: "INVALID" };
  }

  // The result must exist and be published. Only reported once the student AND a usable PIN are confirmed, and it costs no attempt.
  const term = await db.term.findUnique({ where: { id: input.termId }, select: { id: true, sessionId: true } });
  const enrollment = term ? await db.enrollment.findUnique({ where: { studentId_sessionId: { studentId: matched.id, sessionId: term.sessionId } } }) : null;
  const published = enrollment
    ? await db.classResultSheet.findFirst({
        where: { classId: enrollment.classId, termId: input.termId, status: "PUBLISHED", summaries: { some: { enrollmentId: enrollment.id } } },
        select: { id: true },
      })
    : null;
  if (!published) {
    await log("RESULT_NOT_PUBLISHED", { studentId: matched.id, pinId: pin.id, pinStatus: "ACTIVE" });
    return { ok: false, reason: "NOT_PUBLISHED" };
  }

  // Use up one attempt and open the view pass in a single transaction. The conditional update means two
  // simultaneous tries can never use more than the allowed number of attempts.
  const token = newViewToken();
  const used = await db.$transaction(async (tx) => {
    const claimed = await tx.pin.updateMany({
      where: { id: pin.id, status: "ACTIVE", usageCount: { lt: pin.maxUses }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      data: { usageCount: { increment: 1 }, lastUsedAt: now },
    });
    if (claimed.count !== 1) return null;

    const fresh = await tx.pin.findUniqueOrThrow({ where: { id: pin.id } });
    const patch: { firstUsedAt?: Date; expiresAt?: Date; status?: "EXHAUSTED" } = {};
    if (!fresh.firstUsedAt) {
      patch.firstUsedAt = now; // the 40 days start now
      patch.expiresAt = expiryFrom(now);
    }
    if (fresh.usageCount >= fresh.maxUses) patch.status = "EXHAUSTED";
    if (Object.keys(patch).length) await tx.pin.update({ where: { id: pin.id }, data: patch });

    await tx.resultViewSession.create({
      data: { pinId: pin.id, studentId: matched.id, termId: input.termId, tokenHash: hashViewToken(token), expiresAt: viewSessionExpiry(now) },
    });
    await tx.pinAccessLog.create({
      data: { outcome: "SUCCESS", pinId: pin.id, studentId: matched.id, termId: input.termId, pinStatusAtTime: "ACTIVE", ipHash: input.ipHash, userAgent: input.userAgent?.slice(0, 200) ?? null },
    });
    return { usageCount: fresh.usageCount, maxUses: fresh.maxUses };
  });

  if (!used) {
    // Lost a race for the last attempt (or the PIN just expired). Find out why for the log.
    const now2 = await db.pin.findUnique({ where: { id: pin.id } });
    const why = now2 ? effectivePinStatus(now2, now) : "EXHAUSTED";
    await log(why === "DISABLED" ? "PIN_DISABLED" : why === "EXPIRED" ? "PIN_EXPIRED" : "PIN_EXHAUSTED", { studentId: matched.id, pinId: pin.id, pinStatus: why });
    return { ok: false, reason: "INVALID" };
  }

  await writeAudit({ action: AuditAction.RESULT_ACCESSED, entityType: "Pin", entityId: pin.id, metadata: { studentId: matched.id, termId: input.termId, attempt: used.usageCount }, ipHash: input.ipHash });
  if (used.usageCount >= used.maxUses) await writeAudit({ action: AuditAction.PIN_EXHAUSTED, entityType: "Pin", entityId: pin.id });
  return { ok: true, token, attemptsUsed: used.usageCount, maxUses: used.maxUses };
}

/** Looks up a view pass from the cookie. Valid while it has not expired and the PIN has not been switched off. */
export async function findViewSession(token: string, now: Date = new Date()) {
  const row = await db.resultViewSession.findUnique({
    where: { tokenHash: hashViewToken(token) },
    include: { pin: { select: { status: true, usageCount: true, maxUses: true } } },
  });
  if (!row || row.expiresAt <= now || row.pin.status === "DISABLED") return null;
  return { studentId: row.studentId, termId: row.termId, expiresAt: row.expiresAt, attemptsUsed: row.pin.usageCount, maxUses: row.pin.maxUses };
}
