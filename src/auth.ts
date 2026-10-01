import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import authConfig from "@/auth.config";
import { authenticate } from "@/lib/auth/authenticate";

class LockedError extends CredentialsSignin {
  code = "locked";
}

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const result = await authenticate(parsed.data.email, parsed.data.password);
        if (!result.ok) {
          if (result.reason === "locked") throw new LockedError();
          return null;
        }
        return result.user;
      },
    }),
  ],
});
