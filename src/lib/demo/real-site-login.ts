import { PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { isDemoSite } from "./mode";

// Demo site only: teachers sign in with the email and password they registered on the real site. The demo reads the
// real site's accounts through a login that can only see email, name, password hash, role and status (nothing else),
// and on a correct password makes or updates the teacher's practice account on the demo.

const globalForReal = globalThis as unknown as { realSiteDb?: PrismaClient };

function realSiteDb(): PrismaClient | null {
  const url = process.env.REAL_SITE_DATABASE_URL;
  if (!url) return null;
  globalForReal.realSiteDb ??= new PrismaClient({ datasourceUrl: url, log: ["error"] });
  return globalForReal.realSiteDb;
}

/** Brings a real-site teacher's account over to the demo when the password matches. Never throws: sign-in carries on. */
export async function importTeacherFromRealSite(email: string, password: string): Promise<void> {
  if (!isDemoSite()) return;
  const real = realSiteDb();
  if (!real) return;
  try {
    const teacher = await real.user.findUnique({
      where: { email },
      select: { email: true, name: true, passwordHash: true, role: true, status: true },
    });
    if (!teacher || teacher.role !== "TEACHER" || teacher.status !== "ACTIVE") return;
    if (!(await verifyPassword(teacher.passwordHash, password))) return;

    const local = await db.user.findUnique({ where: { email }, select: { id: true, role: true } });
    if (!local) {
      await db.user.create({
        data: { email, name: teacher.name, passwordHash: teacher.passwordHash, role: "TEACHER", teacherProfile: { create: {} } },
      });
    } else if (local.role === "TEACHER") {
      // Keeps the demo copy in step when the teacher changed their password or name on the real site.
      await db.user.update({ where: { id: local.id }, data: { name: teacher.name, passwordHash: teacher.passwordHash, status: "ACTIVE" } });
    }
  } catch (error) {
    console.error("Could not check the real site's accounts", error);
  }
}
