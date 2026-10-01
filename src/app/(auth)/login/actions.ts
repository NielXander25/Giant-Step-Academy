"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { AuditAction, writeAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/session";

export type LoginState = { error?: string } | undefined;

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254),
  password: z.string().min(1, "Enter your password.").max(200),
});

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };

  try {
    // Always lands on /dashboard, which routes each role to its own area (no open redirects).
    await signIn("credentials", { ...parsed.data, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      const code = (error as AuthError & { code?: string }).code;
      if (code === "locked") {
        return { error: "Too many failed attempts. Please wait 15 minutes and try again." };
      }
      return { error: "Incorrect email or password." };
    }
    throw error; // the redirect after a successful sign-in is thrown on purpose
  }
}

export async function signOutAction() {
  const user = await getCurrentUser();
  if (user) await writeAudit({ actorId: user.id, actorRole: user.role, action: AuditAction.LOGOUT });
  await signOut({ redirectTo: "/login" });
}
