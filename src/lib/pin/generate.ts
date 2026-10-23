import { db } from "@/lib/db";
import { makePin, maskPin } from "./format";
import { hashPin } from "./hash";

export const MAX_BATCH = 100;

/**
 * Creates `count` brand-new PINs and returns them in plain text. This is the ONLY moment a PIN exists in
 * readable form: the database keeps only the hash and a masked label.
 * If a randomly chosen PIN already exists (rare), a fresh one is drawn instead.
 */
export async function createPins(args: { count: number; label?: string | null; createdById: string }): Promise<string[]> {
  const created: string[] = [];
  let needed = args.count;

  for (let round = 0; needed > 0 && round < 10; round++) {
    const candidates = new Map<string, string>(); // hash -> PIN
    while (candidates.size < needed) {
      const pin = makePin();
      candidates.set(hashPin(pin), pin);
    }
    const saved = await db.pin.createManyAndReturn({
      data: [...candidates].map(([pinHash, pin]) => ({ pinHash, maskedPin: maskPin(pin), label: args.label ?? null, createdById: args.createdById })),
      skipDuplicates: true, // a hash that already exists is simply not created
      select: { pinHash: true },
    });
    for (const s of saved) created.push(candidates.get(s.pinHash)!);
    needed -= saved.length;
  }
  if (needed > 0) throw new Error("Could not create enough unique PINs.");
  return created;
}
