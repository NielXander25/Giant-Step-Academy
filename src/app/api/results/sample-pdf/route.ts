import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentUser } from "@/lib/auth/session";
import { canManageSchoolProfile } from "@/lib/permissions/policies";
import { db } from "@/lib/db";
import { fetchLogo } from "@/lib/pdf/logo";
import { ResultPdf } from "@/lib/pdf/result-pdf";
import { SAMPLE_RESULT } from "@/lib/pdf/sample";
import { getReportLayout } from "@/lib/results/report-layout-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A made-up report card using the school's real details and layout, so an Admin can check how it will look. Admins only. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword || !canManageSchoolProfile(user)) return new Response("Not allowed.", { status: 403 });

  const [profile, layout] = await Promise.all([db.schoolProfile.findUnique({ where: { id: "singleton" } }), getReportLayout()]);
  const school = profile
    ? { name: profile.name, motto: profile.motto, address: profile.address, phone: profile.phone, email: profile.email, logoUrl: profile.logoUrl, principalName: profile.principalName, isPlaceholder: profile.isPlaceholder }
    : SAMPLE_RESULT.school;
  const data = { ...SAMPLE_RESULT, school, layout };
  const buffer = await renderToBuffer(ResultPdf({ data, logo: await fetchLogo(school.logoUrl) }));

  return new Response(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'inline; filename="sample-report-card.pdf"', "Cache-Control": "no-store" },
  });
}
