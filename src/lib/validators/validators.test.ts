import { describe, expect, it } from "vitest";
import { createClassInput, createSessionInput, createSubjectInput } from "./academic";
import { changePasswordInput, createAdminInput, teacherRegistrationInput } from "./people";

describe("academic session names", () => {
  it("accepts consecutive years only", () => {
    expect(createSessionInput.safeParse({ name: "2026/2027" }).success).toBe(true);
    expect(createSessionInput.safeParse({ name: "2026/2028" }).success).toBe(false);
    expect(createSessionInput.safeParse({ name: "2026-2027" }).success).toBe(false);
    expect(createSessionInput.safeParse({ name: "26/27" }).success).toBe(false);
  });
});

describe("class and subject input", () => {
  it("upper-cases and limits the arm", () => {
    const ok = createClassInput.parse({ levelId: crypto.randomUUID(), arm: "b" });
    expect(ok.arm).toBe("B");
    expect(createClassInput.safeParse({ levelId: crypto.randomUUID(), arm: "TOOLONG" }).success).toBe(false);
    expect(createClassInput.safeParse({ levelId: "not-a-uuid", arm: "A" }).success).toBe(false);
  });
  it("upper-cases the subject code and treats it as optional", () => {
    expect(createSubjectInput.parse({ name: "Mathematics", code: "mth" }).code).toBe("MTH");
    expect(createSubjectInput.parse({ name: "Mathematics" }).code).toBeUndefined();
  });
});

describe("teacher registration", () => {
  const base = { fullName: "Ada Obi", email: "ADA@School.ng", password: "long-enough-pass", confirmPassword: "long-enough-pass" };
  it("lower-cases the email and accepts a valid request", () => {
    const r = teacherRegistrationInput.parse(base);
    expect(r.email).toBe("ada@school.ng");
  });
  it("rejects short or mismatched passwords", () => {
    expect(teacherRegistrationInput.safeParse({ ...base, password: "short", confirmPassword: "short" }).success).toBe(false);
    expect(teacherRegistrationInput.safeParse({ ...base, confirmPassword: "different-password" }).success).toBe(false);
  });
});

describe("admin creation and password change", () => {
  it("requires a 12+ character temporary password", () => {
    expect(createAdminInput.safeParse({ name: "Admin One", email: "a@b.ng", temporaryPassword: "short" }).success).toBe(false);
    expect(createAdminInput.safeParse({ name: "Admin One", email: "a@b.ng", temporaryPassword: "twelve-chars!" }).success).toBe(true);
  });
  it("requires the new password to be confirmed", () => {
    expect(changePasswordInput.safeParse({ currentPassword: "x", newPassword: "a-long-new-pass", confirmPassword: "a-long-new-pass" }).success).toBe(true);
    expect(changePasswordInput.safeParse({ currentPassword: "x", newPassword: "a-long-new-pass", confirmPassword: "nope" }).success).toBe(false);
  });
});
