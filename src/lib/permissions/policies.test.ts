import { describe, expect, it } from "vitest";
import {
  EMPTY_SCOPE, canAdminReview, canApproveStudentUpload, canCreateAdmin, canEnterScores, canFormTeacherReview,
  canManageAdmins, canManagePins, canManageClassStudents, canPublishResults, canViewAuditLogs, canViewClass,
  studentUploadRule, type Actor, type TeacherScope,
} from "./policies";

const superAdmin: Actor = { id: "sa", role: "SUPER_ADMIN" };
const admin: Actor = { id: "ad", role: "ADMIN" };
const adminWithGrant: Actor = { id: "ad2", role: "ADMIN", canCreateAdmins: true };
const teacherA: Actor = { id: "tA", role: "TEACHER" }; // Mathematics -> SS2A
const teacherB: Actor = { id: "tB", role: "TEACHER" }; // Biology -> SS1A and SS2A
const formTeacher: Actor = { id: "tF", role: "TEACHER" }; // Form Teacher of SS2A

const MATHS = "maths", BIOLOGY = "biology", ENGLISH = "english";
const SS1A = "ss1a", SS2A = "ss2a", SS2B = "ss2b", SS3B = "ss3b";

const scopeA: TeacherScope = { formClassIds: [], subjectAssignments: [{ classId: SS2A, subjectId: MATHS }] };
const scopeB: TeacherScope = {
  formClassIds: [],
  subjectAssignments: [{ classId: SS1A, subjectId: BIOLOGY }, { classId: SS2A, subjectId: BIOLOGY }],
};
const scopeForm: TeacherScope = { formClassIds: [SS2A], subjectAssignments: [] };

describe("admin management", () => {
  it("only the Super Admin can create admins, unless an Admin was explicitly granted it", () => {
    expect(canCreateAdmin(superAdmin)).toBe(true);
    expect(canCreateAdmin(admin)).toBe(false);
    expect(canCreateAdmin(adminWithGrant)).toBe(true);
    expect(canCreateAdmin(teacherA)).toBe(false);
  });
  it("only the Super Admin manages admins and sees the audit log", () => {
    expect(canManageAdmins(admin)).toBe(false);
    expect(canManageAdmins(superAdmin)).toBe(true);
    expect(canViewAuditLogs(admin)).toBe(false);
    expect(canViewAuditLogs(superAdmin)).toBe(true);
  });
});

describe("subject teachers are limited to their assignments", () => {
  it("Mathematics/SS2A teacher can enter Mathematics in SS2A", () => {
    expect(canEnterScores(teacherA, scopeA, { classId: SS2A, subjectId: MATHS })).toBe(true);
  });
  it("cannot enter Biology in SS3B by changing IDs", () => {
    expect(canEnterScores(teacherA, scopeA, { classId: SS3B, subjectId: BIOLOGY })).toBe(false);
  });
  it("cannot enter another subject in their own class, or their subject in another class", () => {
    expect(canEnterScores(teacherA, scopeA, { classId: SS2A, subjectId: ENGLISH })).toBe(false);
    expect(canEnterScores(teacherA, scopeA, { classId: SS2B, subjectId: MATHS })).toBe(false);
  });
  it("a teacher with several assignments gets exactly those", () => {
    expect(canEnterScores(teacherB, scopeB, { classId: SS1A, subjectId: BIOLOGY })).toBe(true);
    expect(canEnterScores(teacherB, scopeB, { classId: SS2A, subjectId: BIOLOGY })).toBe(true);
    expect(canEnterScores(teacherB, scopeB, { classId: SS2A, subjectId: MATHS })).toBe(false);
  });
  it("a teacher with no assignments can do nothing", () => {
    expect(canEnterScores(teacherA, EMPTY_SCOPE, { classId: SS2A, subjectId: MATHS })).toBe(false);
    expect(canViewClass(teacherA, EMPTY_SCOPE, SS2A)).toBe(false);
  });
  it("admins do not enter scores", () => {
    expect(canEnterScores(admin, EMPTY_SCOPE, { classId: SS2A, subjectId: MATHS })).toBe(false);
  });
});

describe("form teachers are limited to their own class", () => {
  it("can enter any subject in their own class", () => {
    expect(canEnterScores(formTeacher, scopeForm, { classId: SS2A, subjectId: MATHS })).toBe(true);
    expect(canEnterScores(formTeacher, scopeForm, { classId: SS2A, subjectId: ENGLISH })).toBe(true);
  });
  it("cannot reach SS2B by changing the class ID", () => {
    expect(canEnterScores(formTeacher, scopeForm, { classId: SS2B, subjectId: MATHS })).toBe(false);
    expect(canViewClass(formTeacher, scopeForm, SS2B)).toBe(false);
    expect(canManageClassStudents(formTeacher, scopeForm, SS2B)).toBe(false);
    expect(canManageClassStudents(formTeacher, scopeForm, SS2A)).toBe(true);
  });
});

describe("approval chain", () => {
  it("a Form Teacher reviews their class's submissions but never their own", () => {
    expect(canFormTeacherReview(formTeacher, scopeForm, { classId: SS2A, submittedById: "tA" })).toBe(true);
    expect(canFormTeacherReview(formTeacher, scopeForm, { classId: SS2A, submittedById: "tF" })).toBe(false);
    expect(canFormTeacherReview(formTeacher, scopeForm, { classId: SS2B, submittedById: "tA" })).toBe(false);
  });
  it("a subject teacher cannot approve their own submission", () => {
    expect(canFormTeacherReview(teacherA, scopeA, { classId: SS2A, submittedById: "tA" })).toBe(false);
  });
  it("Admins give final approval; nobody approves their own submission", () => {
    expect(canAdminReview(admin, { submittedById: "tA" })).toBe(true);
    expect(canAdminReview(admin, { submittedById: "ad" })).toBe(false);
    expect(canAdminReview(teacherA, { submittedById: "x" })).toBe(false);
  });
  it("teachers and Form Teachers can never publish", () => {
    expect(canPublishResults(teacherA)).toBe(false);
    expect(canPublishResults(formTeacher)).toBe(false);
    expect(canPublishResults(admin)).toBe(true);
    expect(canPublishResults(superAdmin)).toBe(true);
  });
});

describe("PINs", () => {
  it("only Admin and Super Admin manage PINs", () => {
    expect(canManagePins(admin)).toBe(true);
    expect(canManagePins(superAdmin)).toBe(true);
    expect(canManagePins(formTeacher)).toBe(false);
    expect(canManagePins(teacherA)).toBe(false);
  });
});

describe("student uploads", () => {
  it("Form Teacher uploads to their own class directly", () => {
    expect(studentUploadRule(formTeacher, scopeForm, SS2A)).toBe("DIRECT");
  });
  it("a subject teacher's upload needs Form Teacher approval", () => {
    expect(studentUploadRule(teacherA, scopeA, SS2A)).toBe("NEEDS_FORM_TEACHER_APPROVAL");
  });
  it("uploads into unrelated classes are denied", () => {
    expect(studentUploadRule(teacherA, scopeA, SS3B)).toBe("DENIED");
    expect(studentUploadRule(formTeacher, scopeForm, SS2B)).toBe("DENIED");
  });
  it("the Form Teacher of that class approves, never the uploader, never another class's Form Teacher", () => {
    expect(canApproveStudentUpload(formTeacher, scopeForm, { classId: SS2A, uploadedById: "tA" })).toBe(true);
    expect(canApproveStudentUpload(formTeacher, scopeForm, { classId: SS2A, uploadedById: "tF" })).toBe(false);
    expect(canApproveStudentUpload(formTeacher, scopeForm, { classId: SS2B, uploadedById: "tA" })).toBe(false);
    expect(canApproveStudentUpload(teacherA, scopeA, { classId: SS2A, uploadedById: "tA" })).toBe(false);
  });
});
