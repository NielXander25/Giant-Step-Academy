import { renderToBuffer } from "@react-pdf/renderer";
import { z } from "zod";
import { AuditAction, writeAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/session";
import { splitPhones } from "@/lib/cms/helpers";
import { db } from "@/lib/db";
import { canGeneratePins } from "@/lib/permissions/policies";
import { CREST_PNG } from "@/lib/pdf/crest";
import { fetchLogo } from "@/lib/pdf/logo";
import { PinCardsPdf } from "@/lib/pdf/pin-cards-pdf";
import { MAX_BATCH } from "@/lib/pin/generate";
import { hashPin } from "@/lib/pin/hash";
import { PIN_PATTERN } from "@/lib/pin/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({
  pins: z.array(z.string().regex(PIN_PATTERN)).min(1).max(MAX_BATCH),
  label: z.string().trim().max(60).optional(),
});

/**
 * Printable cards for PINs just created. The PINs come from the Super Admin's own browser (the server never keeps
 * them), and each one must be a real PIN on record, so cards cannot be made for invented numbers.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword || !canGeneratePins(user)) return new Response("Not allowed.", { status: 403 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response("Those PINs could not be read.", { status: 400 });
  const pins = [...new Set(parsed.data.pins)];

  const known = await db.pin.count({ where: { pinHash: { in: pins.map(hashPin) } } });
  if (known !== pins.length) return new Response("Some of those PINs are not on record.", { status: 400 });

  const profile = await db.schoolProfile.findUnique({ where: { id: "singleton" } });
  const logo = await fetchLogo(profile?.logoUrl);
  const buffer = await renderToBuffer(
    PinCardsPdf({
      pins,
      label: parsed.data.label || null,
      createdAt: new Date(),
      school: {
        name: profile?.name ?? "Giant Step Academy",
        motto: profile?.motto ?? null,
        phone: splitPhones(profile?.phone)[0] ?? null,
        website: profile?.websiteUrl || "https://giantstepacademy.com.ng",
      },
      crest: logo ?? CREST_PNG,
    }),
  );
  // Only the count is logged, never the PINs.
  await writeAudit({ actorId: user.id, actorRole: user.role, action: AuditAction.PIN_PDF_DOWNLOADED, entityType: "Pin", metadata: { count: pins.length } });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="result-pins-${stamp}.pdf"`, "Cache-Control": "no-store" },
  });
}
