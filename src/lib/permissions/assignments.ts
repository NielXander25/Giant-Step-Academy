import { cache } from "react";
import { db } from "@/lib/db";
import { EMPTY_SCOPE, type TeacherScope } from "@/lib/permissions/policies";

export const getCurrentSessionId = cache(async (): Promise<string | null> => {
  const session = await db.academicSession.findFirst({ where: { isCurrent: true }, select: { id: true } });
  return session?.id ?? null;
});

/**
 * Loads what a teacher is assigned to in the current session, straight from the database.
 * Always load this on the server for each request — never trust class or subject IDs sent by the browser.
 */
export const loadTeacherScope = cache(async (teacherId: string): Promise<TeacherScope> => {
  const sessionId = await getCurrentSessionId();
  if (!sessionId) return EMPTY_SCOPE;

  const [form, subjects] = await Promise.all([
    db.formTeacherAssignment.findMany({ where: { teacherId, sessionId }, select: { classId: true } }),
    db.subjectAssignment.findMany({ where: { teacherId, sessionId }, select: { classId: true, subjectId: true } }),
  ]);

  return {
    formClassIds: form.map((f) => f.classId),
    subjectAssignments: subjects,
  };
});
