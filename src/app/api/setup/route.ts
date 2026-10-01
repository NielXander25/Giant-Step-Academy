import { NextResponse } from "next/server";
import { z } from "zod";
import { getSetupEnv } from "@/lib/env";
import { isSetupComplete, runSetup } from "@/lib/setup/bootstrap";

export const dynamic = "force-dynamic";

/** Reports whether setup is configured and finished. Reveals nothing sensitive. */
export async function GET() {
  try {
    return NextResponse.json({
      configured: getSetupEnv() !== null,
      completed: await isSetupComplete(),
    });
  } catch {
    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }
}

const bodySchema = z.object({ token: z.string().min(1).max(200) });

/** Runs first-time setup. Requires the SETUP_TOKEN. Works only once. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the setup token." }, { status: 400 });
  }

  try {
    const result = await runSetup(parsed.data.token);
    if (result.ok) {
      return NextResponse.json({ ok: true, email: result.email });
    }
    const messages = {
      not_configured: "Setup variables are missing. Add SETUP_TOKEN and the SUPER_ADMIN_* values in Vercel, then redeploy.",
      invalid_token: "That setup token is not correct.",
      already_completed: "Setup has already been completed.",
    } as const;
    const status = result.reason === "invalid_token" ? 403 : result.reason === "already_completed" ? 409 : 500;
    return NextResponse.json({ ok: false, error: messages[result.reason] }, { status });
  } catch (error) {
    console.error("Setup failed", error);
    return NextResponse.json(
      { ok: false, error: "Setup could not reach the database. Check DATABASE_URL and that migrations ran." },
      { status: 503 },
    );
  }
}
