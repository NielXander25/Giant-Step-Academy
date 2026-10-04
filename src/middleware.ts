import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Quick gate: anyone without a session cookie is sent to /login before the page runs.
// The real checks (role, active status, assignments) happen on the server in every page and action.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/dashboard", "/admin/:path*", "/teacher/:path*", "/super-admin/:path*", "/account/:path*"],
};
