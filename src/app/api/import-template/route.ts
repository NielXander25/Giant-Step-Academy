import { getCurrentUser } from "@/lib/auth/session";
import { buildStudentTemplate } from "@/lib/students/template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Downloads the blank student spreadsheet. Staff only. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword) return new Response("Please sign in.", { status: 401 });

  const file = await buildStudentTemplate();
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="giant-step-student-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
