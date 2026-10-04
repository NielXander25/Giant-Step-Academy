import type { Role } from "@prisma/client";
import { z } from "zod";
import { AppError, ForbiddenError } from "@/lib/errors";
import { assertRole, type SessionUser } from "@/lib/auth/session";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

type ActionConfig<S extends z.ZodTypeAny, T> = {
  /** Roles allowed to call this action. Checked on the server before anything else. */
  roles: Role[];
  /** Input is always validated here, never trusted from the browser. */
  input: S;
  /** Only the change-password action sets this; everything else is blocked until the password is changed. */
  allowPasswordChangePending?: boolean;
  handler: (ctx: { user: SessionUser; input: z.infer<S> }) => Promise<T>;
};

/**
 * Wraps every server action so the same steps always happen, in this order:
 * 1) the caller must be signed in, active and in an allowed role,
 * 2) the input is validated,
 * 3) the handler runs (and checks assignment-level policies itself),
 * 4) expected errors become friendly messages; unexpected errors are logged and hidden.
 */
export function defineAction<S extends z.ZodTypeAny, T>(config: ActionConfig<S, T>) {
  return async (raw: z.input<S>): Promise<ActionResult<T>> => {
    try {
      const user = await assertRole(...config.roles);
      if (user.mustChangePassword && !config.allowPasswordChangePending) {
        throw new ForbiddenError("Please change your temporary password first.");
      }

      const parsed = config.input.safeParse(raw);
      if (!parsed.success) {
        return {
          ok: false,
          error: "Please correct the highlighted fields.",
          fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>,
        };
      }

      const data = await config.handler({ user, input: parsed.data });
      return { ok: true, data };
    } catch (error) {
      if (error instanceof AppError) return { ok: false, error: error.message };
      // Next.js uses thrown errors for redirects/not-found; let those through.
      if (error instanceof Error && "digest" in error) throw error;
      console.error("Unhandled action error", error);
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  };
}
