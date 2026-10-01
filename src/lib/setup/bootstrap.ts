import { createHash, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSetupEnv } from "@/lib/env";
import { hashPassword } from "@/lib/auth/password";
import { DEFAULT_SETTINGS, SETUP_COMPLETED_KEY } from "@/lib/constants";

export type SetupResult =
  | { ok: true; email: string }
  | { ok: false; reason: "not_configured" | "invalid_token" | "already_completed" };

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function isSetupComplete(): Promise<boolean> {
  const row = await db.systemSetting.findUnique({ where: { key: SETUP_COMPLETED_KEY } });
  return row !== null;
}

/**
 * One-time platform setup. Creates the Super Admin, the school profile (placeholders)
 * and default settings. After it succeeds once it can never run again.
 */
export async function runSetup(token: string): Promise<SetupResult> {
  const cfg = getSetupEnv();
  if (!cfg) return { ok: false, reason: "not_configured" };
  if (!safeEqual(token, cfg.SETUP_TOKEN)) return { ok: false, reason: "invalid_token" };
  if (await isSetupComplete()) return { ok: false, reason: "already_completed" };

  const email = cfg.SUPER_ADMIN_EMAIL.trim().toLowerCase();
  const passwordHash = await hashPassword(cfg.SUPER_ADMIN_PASSWORD);

  try {
    await db.$transaction(async (tx) => {
      // The primary key on SystemSetting.key is the lock: a second concurrent run fails here (P2002).
      await tx.systemSetting.create({
        data: { key: SETUP_COMPLETED_KEY, value: { completedAt: new Date().toISOString() } },
      });

      const existing = await tx.user.findFirst({ where: { role: "SUPER_ADMIN" }, select: { id: true } });
      const superAdmin =
        existing ??
        (await tx.user.create({
          data: {
            email,
            name: cfg.SUPER_ADMIN_NAME.trim(),
            passwordHash,
            role: "SUPER_ADMIN",
            canCreateAdmins: true,
          },
          select: { id: true },
        }));

      await tx.schoolProfile.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } });

      await tx.systemSetting.createMany({
        data: Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
          key,
          value: value as Prisma.InputJsonValue,
        })),
        skipDuplicates: true,
      });

      await tx.auditLog.create({
        data: {
          actorId: superAdmin.id,
          actorRole: "SUPER_ADMIN",
          action: "SETUP_COMPLETED",
          entityType: "User",
          entityId: superAdmin.id,
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, reason: "already_completed" };
    }
    throw error;
  }

  return { ok: true, email };
}
