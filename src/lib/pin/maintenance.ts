import { db } from "@/lib/db";
import { AuditAction, writeAudit } from "@/lib/audit";

/**
 * The nightly tidy-up. Safe to run any time, as often as you like.
 *  - PINs whose 40 days are over are marked Expired (they were already refused; this keeps the lists accurate)
 *  - viewing passes that ended more than a day ago are deleted
 *  - used or old password-reset tokens are deleted
 */
export async function runMaintenance(now: Date = new Date()) {
  const dayAgo = new Date(now.getTime() - 86_400_000);
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);

  const [pins, passes, tokens] = await Promise.all([
    db.pin.updateMany({ where: { status: "ACTIVE", expiresAt: { lte: now } }, data: { status: "EXPIRED" } }),
    db.resultViewSession.deleteMany({ where: { expiresAt: { lt: dayAgo } } }),
    db.passwordResetToken.deleteMany({ where: { OR: [{ expiresAt: { lt: weekAgo } }, { usedAt: { not: null } }] } }),
  ]);
  const result = { pinsExpired: pins.count, passesRemoved: passes.count, tokensRemoved: tokens.count };
  if (result.pinsExpired || result.passesRemoved || result.tokensRemoved) {
    await writeAudit({ action: AuditAction.MAINTENANCE_RUN, entityType: "System", metadata: result });
  }
  return result;
}
