"use server";

import { z } from "zod";
import { defineAction } from "@/lib/action";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { runPromotion } from "./execute";

const id = z.string().uuid();
const input = z.object({
  fromSessionId: id,
  toSessionId: id,
  overrides: z.record(id, z.union([id, z.literal("GRADUATE")])).default({}),
  allowUnpublished: z.boolean().default(false),
});

export const runPromotionAction = defineAction({
  roles: ADMIN_ROLES,
  input,
  handler: async ({ user, input }) => runPromotion(user, input),
});
