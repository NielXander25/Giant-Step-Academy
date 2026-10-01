import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSetupEnv } from "@/lib/env";
import { isSetupComplete } from "@/lib/setup/bootstrap";
import { SetupForm } from "./setup-form";

export const metadata: Metadata = { title: "First-time setup", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function loadStatus() {
  try {
    return { configured: getSetupEnv() !== null, completed: await isSetupComplete(), dbError: false };
  } catch {
    return { configured: getSetupEnv() !== null, completed: false, dbError: true };
  }
}

export default async function SetupPage() {
  const { configured, completed, dbError } = await loadStatus();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>First-time setup</CardTitle>
          <CardDescription>Creates the Super Admin account and default school settings. Works once only.</CardDescription>
        </CardHeader>
        <CardContent>
          {dbError ? (
            <p className="text-sm text-destructive">
              The database could not be reached. Check DATABASE_URL and DIRECT_URL in Vercel, then redeploy.
            </p>
          ) : completed ? (
            <p className="text-sm text-muted-foreground">
              Setup is complete. Sign-in is added in the next phase. You can remove SETUP_TOKEN and
              SUPER_ADMIN_PASSWORD from Vercel now.
            </p>
          ) : !configured ? (
            <p className="text-sm text-destructive">
              Setup variables are missing. Add SETUP_TOKEN, SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL and
              SUPER_ADMIN_PASSWORD in Vercel, then redeploy.
            </p>
          ) : (
            <SetupForm />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
