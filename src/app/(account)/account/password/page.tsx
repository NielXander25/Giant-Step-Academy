import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Change password" };

export default async function PasswordPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader
        title="Change password"
        description={user.mustChangePassword ? "Your account was created with a temporary password. Choose your own to continue." : "Choose a new password for your account."}
      />
      <Card>
        <CardContent className="pt-6">
          <PasswordForm forced={user.mustChangePassword} />
        </CardContent>
      </Card>
    </>
  );
}
