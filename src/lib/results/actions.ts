"use server";

import { defineAction } from "@/lib/action";
import { loadTeacherScope } from "@/lib/permissions/assignments";
import { EMPTY_SCOPE } from "@/lib/permissions/policies";
import { ADMIN_ROLES, ALL_STAFF_ROLES } from "@/lib/permissions/roles";
import {
  adminReviewInput, classRefInput, reviewSubjectInput, saveRemarksInput, saveScoresInput, subjectRefInput, unpublishInput,
} from "@/lib/validators/results";
import * as service from "./service";

const scopeOf = (user: { id: string; role: string }) => (user.role === "TEACHER" ? loadTeacherScope(user.id) : Promise.resolve(EMPTY_SCOPE));

export const saveScoresAction = defineAction({
  roles: ALL_STAFF_ROLES, input: saveScoresInput,
  handler: async ({ user, input }) => service.saveScores(user, await scopeOf(user), input),
});
export const submitSubjectAction = defineAction({
  roles: ALL_STAFF_ROLES, input: subjectRefInput,
  handler: async ({ user, input }) => service.submitSubject(user, await scopeOf(user), input),
});
export const reviewSubjectAction = defineAction({
  roles: ALL_STAFF_ROLES, input: reviewSubjectInput,
  handler: async ({ user, input }) => service.reviewSubject(user, await scopeOf(user), input),
});
export const takeBackSubjectAction = defineAction({
  roles: ALL_STAFF_ROLES, input: subjectRefInput,
  handler: async ({ user, input }) => service.takeBackSubject(user, await scopeOf(user), input),
});
export const reopenSubjectAction = defineAction({
  roles: ALL_STAFF_ROLES, input: subjectRefInput,
  handler: async ({ user, input }) => service.reopenSubject(user, await scopeOf(user), input),
});
export const saveRemarksAction = defineAction({
  roles: ALL_STAFF_ROLES, input: saveRemarksInput,
  handler: async ({ user, input }) => service.saveRemarks(user, await scopeOf(user), input),
});
export const submitSheetAction = defineAction({
  roles: ALL_STAFF_ROLES, input: classRefInput,
  handler: async ({ user, input }) => service.submitSheet(user, await scopeOf(user), input),
});
export const adminReviewSheetAction = defineAction({
  roles: ADMIN_ROLES, input: adminReviewInput,
  handler: async ({ user, input }) => service.adminReviewSheet(user, input),
});
export const publishSheetAction = defineAction({
  roles: ADMIN_ROLES, input: classRefInput,
  handler: async ({ user, input }) => service.publishSheet(user, input),
});
export const unpublishSheetAction = defineAction({
  roles: ADMIN_ROLES, input: unpublishInput,
  handler: async ({ user, input }) => service.unpublishSheet(user, input),
});
