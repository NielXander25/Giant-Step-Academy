import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "My profile" };

export default async function OnboardingPage() {
  const user = await requireRole("TEACHER");
  const profile = await db.teacherProfile.findUnique({ where: { userId: user.id } });

  return (
    <>
      <PageHeader title="My profile" description="Your details are visible to school administrators only." />
      <Card>
        <CardContent className="pt-6">
          <OnboardingForm
            initial={{
              phone: profile?.phone ?? "",
              staffNumber: profile?.staffNumber ?? "",
              qualification: profile?.qualification ?? "",
              bio: profile?.bio ?? "",
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
