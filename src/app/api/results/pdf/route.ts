import { cookies } from "next/headers";
import { renderToBuffer } from "@react-pdf/renderer";
import { findViewSession } from "@/lib/pin/access";
import { fetchLogo } from "@/lib/pdf/logo";
import { ResultPdf } from "@/lib/pdf/result-pdf";
import { loadPublishedResult, type PublishedResult } from "@/lib/pin/result-data";
import { VIEW_COOKIE } from "@/lib/pin/view-session";
import { isSampleEnabled, loadSampleResult, parseSampleCookie, SAMPLE_COOKIE } from "@/lib/pin/sample-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const text = (message: string, status: number) => new Response(message, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Downloads the open result as a PDF. It needs the same viewing pass as the result page and does NOT use another
 * PIN attempt. Without a valid pass nothing is produced.
 */
export async function GET() {
  const jar = await cookies();
  const sample = parseSampleCookie(jar.get(SAMPLE_COOKIE)?.value);
  if (sample && (await isSampleEnabled())) return pdfResponse(await loadSampleResult(sample.stage, sample.termId), "sample-result");

  const token = jar.get(VIEW_COOKIE)?.value;
  if (!token) return text("Please open the result first.", 401);
  const pass = await findViewSession(token);
  if (!pass) return text("Your viewing time has ended. Please enter your details again.", 401);

  const data = await loadPublishedResult(pass.studentId, pass.termId);
  if (!data) return text("This result is not available.", 404);
  return pdfResponse(data, `result-${data.student.admissionNumber}-${data.termName}-${data.sessionName}`);
}

async function pdfResponse(data: PublishedResult, name: string) {
  const [logo, photo] = await Promise.all([fetchLogo(data.school.logoUrl), fetchLogo(data.student.photoUrl)]);
  const buffer = await renderToBuffer(ResultPdf({ data, logo, photo }));
  const file = name.replace(/[^A-Za-z0-9._-]+/g, "-");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
