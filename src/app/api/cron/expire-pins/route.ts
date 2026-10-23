import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runMaintenance } from "@/lib/pin/maintenance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const same = (a: string, b: string) => timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

/**
 * Called once a night by Vercel Cron (see vercel.json). Vercel sends "Authorization: Bearer <CRON_SECRET>".
 * Without the right secret nothing happens, so nobody else can trigger it.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not set." }, { status: 503 });
  if (!same(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await runMaintenance()) });
}
