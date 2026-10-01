import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  canCreateAdmins: boolean;
};

/**
 * The signed-in user, loaded fresh from the database.
 * The session cookie only proves who signed in; role and active status always come from the
 * database, so deactivating or changing someone takes effect on their very next request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, status: true, canCreateAdmins: true },
  });
  if (!user || user.status !== "ACTIVE") return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role, canCreateAdmins: user.canCreateAdmins };
});

/** For pages and layouts: sends signed-out visitors to the login page. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For pages and layouts: wrong role goes back to /dashboard, which routes each role to its own area. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

/** For server actions and API handlers: throws instead of redirecting. */
export async function assertRole(...roles: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}

export function homePathFor(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin";
    case "ADMIN":
      return "/admin";
    default:
      return "/teacher";
  }
}
