import type { Metadata } from "next";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ResultSheet } from "@/components/portal/result-sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { SAMPLE_RESULT } from "@/lib/pdf/sample";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { getReportLayout } from "@/lib/results/report-layout-store";
import { ReportLayoutForm, SchoolProfileForm } from "./school-forms";

export const metadata: Metadata = { title: "School & report card" };

export default async function SchoolSettingsPage() {
  await requireRole(...ADMIN_ROLES);
  const [profile, layout] = await Promise.all([db.schoolProfile.findUnique({ where: { id: "singleton" } }), getReportLayout()]);
  const school = {
    name: profile?.name ?? "Giant Step Academy", motto: profile?.motto ?? "", address: profile?.address ?? "", phone: profile?.phone ?? "",
    email: profile?.email ?? "", principalName: profile?.principalName ?? "", logoUrl: profile?.logoUrl ?? "", websiteUrl: profile?.websiteUrl ?? "",
  };

  return (
    <>
      <PageHeader title="School & report card" description="The details printed at the top of every report card, and which parts of the report are shown." />

      {profile?.isPlaceholder !== false && (
        <p className="mb-6 rounded-lg bg-accent-soft px-3 py-2 text-sm">
          The school details are still placeholders (for example "[SCHOOL ADDRESS]"). Enter the real ones below before results are published.
        </p>
      )}

      <Card className="mb-6">
        <CardHeader><CardTitle>School details</CardTitle><CardDescription>Shown in the header of the report card and in the PDF.</CardDescription></CardHeader>
        <CardContent><SchoolProfileForm initial={school} /></CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>Report card layout</CardTitle><CardDescription>Change what the report shows. The preview below updates after you save.</CardDescription></CardHeader>
        <CardContent><ReportLayoutForm initial={layout} /></CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Preview</CardTitle>
            <CardDescription>A made-up student, using your saved school details and layout.</CardDescription>
          </div>
          <a href="/api/results/sample-pdf" target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-sm hover:bg-primary-soft">
            <Download className="size-4" aria-hidden="true" /> Open sample PDF
          </a>
        </CardHeader>
        <CardContent>
          <ResultSheet
            data={{
              ...SAMPLE_RESULT,
              layout,
              school: { ...SAMPLE_RESULT.school, ...{ name: school.name, motto: school.motto || null, address: school.address || null, phone: school.phone || null, email: school.email || null, logoUrl: school.logoUrl || null, principalName: school.principalName || null } },
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
