"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { defineAction } from "@/lib/action";
import { isDemoSite } from "@/lib/demo/mode";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { getCurrentSessionId } from "@/lib/permissions/assignments";
import { isUniqueViolation } from "@/lib/prisma-errors";

// Demo site only: teachers pick their own classes and subjects. Each subject in a class has one teacher and each class
// one Form Teacher (the database refuses a second), so once something is taken nobody else can take it.

async function demoSession() {
  if (!isDemoSite()) throw new ForbiddenError("Teachers choose their own classes on the demo site only.");
  const sessionId = await getCurrentSessionId();
  if (!sessionId) throw new ConflictError("There is no current session. Ask the Admin to load the practice school.");
  return sessionId;
}

const subjectInput = z.object({ classId: z.string().uuid(), subjectId: z.string().uuid() });
const classInput = z.object({ classId: z.string().uuid() });

export const takeSubjectAction = defineAction({
  roles: ["TEACHER"],
  input: subjectInput,
  handler: async ({ user, input }) => {
    const sessionId = await demoSession();
    const offered = await db.classSubject.findFirst({ where: { classId: input.classId, subjectId: input.subjectId }, select: { id: true } });
    if (!offered) throw new NotFoundError("That class does not offer this subject.");
    try {
      await db.subjectAssignment.create({ data: { teacherId: user.id, classId: input.classId, subjectId: input.subjectId, sessionId } });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError("Someone has just taken this subject. Pick another.");
      throw error;
    }
    return { taken: true };
  },
});

export const releaseSubjectAction = defineAction({
  roles: ["TEACHER"],
  input: subjectInput,
  handler: async ({ user, input }) => {
    const sessionId = await demoSession();
    await db.subjectAssignment.deleteMany({ where: { teacherId: user.id, classId: input.classId, subjectId: input.subjectId, sessionId } });
    return { released: true };
  },
});

export const takeFormClassAction = defineAction({
  roles: ["TEACHER"],
  input: classInput,
  handler: async ({ user, input }) => {
    const sessionId = await demoSession();
    const mine = await db.formTeacherAssignment.findFirst({ where: { teacherId: user.id, sessionId }, include: { class: { select: { name: true } } } });
    if (mine) throw new ConflictError(`You are already the Form Teacher of ${mine.class.name}. Release it first: a teacher has one form class.`);
    try {
      await db.formTeacherAssignment.create({ data: { teacherId: user.id, classId: input.classId, sessionId } });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError("Someone has just become this class's Form Teacher. Pick another class.");
      throw error;
    }
    return { taken: true };
  },
});

export const releaseFormClassAction = defineAction({
  roles: ["TEACHER"],
  input: classInput,
  handler: async ({ user, input }) => {
    const sessionId = await demoSession();
    await db.formTeacherAssignment.deleteMany({ where: { teacherId: user.id, classId: input.classId, sessionId } });
    return { released: true };
  },
});
