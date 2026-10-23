import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { makeUploadTicket } from "@/lib/cms/upload-sign";
import { canManageWebsiteContent } from "@/lib/permissions/policies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Gives a signed-in Admin a one-time ticket to upload a picture directly to Cloudinary. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword || !canManageWebsiteContent(user)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  const ticket = makeUploadTicket({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME, apiKey: process.env.CLOUDINARY_API_KEY, apiSecret: process.env.CLOUDINARY_API_SECRET,
  });
  if (!ticket) return NextResponse.json({ error: "uploads_not_configured" }, { status: 503 });
  return NextResponse.json(ticket, { headers: { "Cache-Control": "no-store" } });
}
