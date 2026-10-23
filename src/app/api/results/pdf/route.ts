import { cookies } from "next/headers";
import { renderToBuffer } from "@react-pdf/renderer";
import { findViewSession } from "@/lib/pin/access";
import { fetchLogo } from "@/lib/pdf/logo";
import { ResultPdf } from "@/lib/pdf/result-pdf";
import { loadPublishedResult } from "@/lib/pin/result-data";
import { VIEW_COOKIE } from "@/lib/pin/view-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const text = (message: string, status: number) => new Response(message, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Downloads the open result as a PDF. It needs the same viewing pass as the result page and does NOT use another
 * PIN attempt. Without a valid pass nothing is produced.
 */
export async function GET() {
  const token = (await cookies()).get(VIEW_COOKIE)?.value;
  if (!token) return text("Please open the result first.", 401);
  const pass = await findViewSession(token);
  if (!pass) return text("Your viewing time has ended. Please enter your details again.", 401);

  const data = await loadPublishedResult(pass.studentId, pass.termId);
  if (!data) return text("This result is not available.", 404);

  const logo = await fetchLogo(data.school.logoUrl);
  const buffer = await renderToBuffer(ResultPdf({ data, logo }));
  const file = `result-${data.student.admissionNumber}-${data.termName}-${data.sessionName}`.replace(/[^A-Za-z0-9._-]+/g, "-");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
