"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { defineAction } from "@/lib/action";
import { AuditAction, writeAudit } from "@/lib/audit";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { assertAllowed, canManagePins } from "@/lib/permissions/policies";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { MAX_BATCH, createPins } from "./generate";
import { isPepperConfigured } from "./hash";
import { canEnable } from "./lifecycle";
import { setSampleEnabled } from "./sample-access";

const generateInput = z.object({
  count: z.number().int().min(1, "Choose at least 1.").max(MAX_BATCH, `Up to ${MAX_BATCH} at a time.`),
  label: z.string().trim().max(60).optional(),
});

export const generatePinsAction = defineAction({
  roles: ADMIN_ROLES,
  input: generateInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManagePins(user));
    if (!isPepperConfigured()) throw new ConflictError("PINs cannot be created yet: the PIN_PEPPER setting is missing in Vercel.");
    const pins = await createPins({ count: input.count, label: input.label || null, createdById: user.id });
    // Only the count and label are logged, never the PINs themselves.
    await writeAudit({ actorId: user.id, actorRole: user.role, action: AuditAction.PIN_GENERATED, entityType: "Pin", metadata: { count: pins.length, label: input.label || null } });
    return { pins };
  },
});

const toggleInput = z.object({ pinId: z.string().uuid(), enabled: z.boolean(), reason: z.string().trim().max(200).optional() });

export const setPinEnabledAction = defineAction({
  roles: ADMIN_ROLES,
  input: toggleInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManagePins(user));
    const pin = await db.pin.findUnique({ where: { id: input.pinId } });
    if (!pin) throw new NotFoundError("That PIN could not be found.");

    if (input.enabled) {
      if (!canEnable(pin)) throw new ConflictError("Only a disabled PIN that still has uses left and has not expired can be switched back on.");
      const done = await db.pin.updateMany({ where: { id: pin.id, status: "DISABLED" }, data: { status: "ACTIVE", disabledAt: null, disabledById: null, disabledReason: null } });
      if (done.count !== 1) throw new ConflictError("That PIN changed in the meantime. Reload and try again.");
    } else {
      const done = await db.pin.updateMany({
        where: { id: pin.id, status: "ACTIVE" },
        data: { status: "DISABLED", disabledAt: new Date(), disabledById: user.id, disabledReason: input.reason || null },
      });
      if (done.count !== 1) throw new ConflictError("Only an active PIN can be disabled.");
    }
    await writeAudit({ actorId: user.id, actorRole: user.role, action: input.enabled ? AuditAction.PIN_ENABLED : AuditAction.PIN_DISABLED, entityType: "Pin", entityId: pin.id });
    return { id: pin.id };
  },
});

/** Switches the practice result (sample details + sample PIN) on or off for everyone. */
export const setSampleResultAction = defineAction({
  roles: ADMIN_ROLES,
  input: z.object({ enabled: z.boolean() }),
  handler: async ({ user, input }) => {
    assertAllowed(canManagePins(user));
    await setSampleEnabled(input.enabled, user.id);
    await writeAudit({ actorId: user.id, actorRole: user.role, action: AuditAction.SAMPLE_RESULT_CHANGED, entityType: "SystemSetting", metadata: { enabled: input.enabled } });
    return { enabled: input.enabled };
  },
});
