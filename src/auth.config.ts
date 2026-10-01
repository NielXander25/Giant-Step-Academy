import type { NextAuthConfig } from "next-auth";

// Edge-safe part of the auth setup (no database, no password hashing).
// The middleware uses this; the full setup with the credentials check is in auth.ts.
export default {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // staff sessions last 8 hours
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
