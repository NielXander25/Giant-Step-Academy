"use server";

import { db } from "@/lib/db";
import { defineAction } from "@/lib/action";
import { onboardingInput } from "@/lib/validators/people";

export const saveTeacherProfile = defineAction({
  roles: ["TEACHER"],
  input: onboardingInput,
  handler: async ({ user, input }) => {
    // Always the signed-in teacher's own profile; the browser cannot choose whose profile to edit.
    await db.teacherProfile.upsert({
      where: { userId: user.id },
      update: { phone: input.phone, staffNumber: input.staffNumber || null, qualification: input.qualification || null, bio: input.bio || null, profileCompleted: true },
      create: { userId: user.id, phone: input.phone, staffNumber: input.staffNumber || null, qualification: input.qualification || null, bio: input.bio || null, profileCompleted: true },
    });
    return { saved: true };
  },
});
