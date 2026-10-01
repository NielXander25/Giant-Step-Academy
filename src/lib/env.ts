import { z } from "zod";

const setupSchema = z.object({
  SETUP_TOKEN: z.string().min(16, "SETUP_TOKEN must be at least 16 characters"),
  SUPER_ADMIN_NAME: z.string().min(2),
  SUPER_ADMIN_EMAIL: z.string().email(),
  SUPER_ADMIN_PASSWORD: z.string().min(12, "SUPER_ADMIN_PASSWORD must be at least 12 characters"),
});

export type SetupEnv = z.infer<typeof setupSchema>;

/**
 * Returns the first-time-setup variables, or null if any are missing or invalid.
 * Read lazily so the build never fails just because these are not set yet.
 */
export function getSetupEnv(): SetupEnv | null {
  const parsed = setupSchema.safeParse({
    SETUP_TOKEN: process.env.SETUP_TOKEN,
    SUPER_ADMIN_NAME: process.env.SUPER_ADMIN_NAME,
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
  });
  return parsed.success ? parsed.data : null;
}
