import { Prisma } from "@prisma/client";

/** True when a database unique constraint was violated (for example a duplicate name). */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
