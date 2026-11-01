import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
    /** When this session signed in (ms). A password change after this ends the session. */
    authAt?: number;
  }
  interface User {
    role?: Role;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    authAt?: number;
  }
}
