import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { AuditAction, writeAudit } from "@/lib/audit";
import { getIpHash } from "@/lib/request";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { LOGIN_ATTEMPT_ENTITY, isLockedOut } from "@/lib/auth/throttle";

export type AuthResult =
  | { ok: true; user: { id: string; email: string; name: string; role: Role } }
  | { ok: false; reason: "locked" | "invalid" };

// Verifying against a dummy hash when the email is unknown keeps response time
// the same, so attackers cannot tell which emails have accounts.
let dummyHashPromise: Promise<string> | null = null;
function getDummyHash() {
  dummyHashPromise ??= hashPassword("not-a-real-password-for-timing");
  return dummyHashPromise;
}

/** The single place where staff credentials are checked. Used by the sign-in provider. */
export async function authenticate(rawEmail: string, password: string): Promise<AuthResult> {
  const email = rawEmail.trim().toLowerCase();
  const ipHash = await getIpHash();

  if (await isLockedOut(email, ipHash)) return { ok: false, reason: "locked" };

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, status: true, passwordHash: true },
  });

  const passwordOk = await verifyPassword(user?.passwordHash ?? (await getDummyHash()), password);

  if (!user || !passwordOk || user.status !== "ACTIVE") {
    await writeAudit({
      action: AuditAction.LOGIN_FAILED,
      entityType: LOGIN_ATTEMPT_ENTITY,
      entityId: email,
      ipHash,
    });
    return { ok: false, reason: "invalid" };
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await writeAudit({
    actorId: user.id,
    actorRole: user.role,
    action: AuditAction.LOGIN_SUCCEEDED,
    entityType: LOGIN_ATTEMPT_ENTITY,
    entityId: email,
    ipHash,
  });

  return { ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}
