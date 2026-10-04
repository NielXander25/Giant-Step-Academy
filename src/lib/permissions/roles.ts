import type { Role } from "@prisma/client";

export const ADMIN_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN"];
export const ALL_STAFF_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "TEACHER"];
