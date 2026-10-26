import { describe, expect, it } from "vitest";
import { batchTransition, canEditBatch, sheetTransition, type BatchAction, type BatchStatus, type SheetAction, type SheetStatus } from "./workflow";

const BATCH_STATES: BatchStatus[] = ["DRAFT", "SUBMITTED", "FORM_TEACHER_APPROVED", "FORM_TEACHER_REJECTED"];
const SHEET_STATES: SheetStatus[] = ["DRAFT", "ADMIN_REVIEW", "ADMIN_APPROVED", "PUBLISHED"];

describe("subject result workflow", () => {
  it("a subject teacher's work goes to the Form Teacher before anything else", () => {
    expect(batchTransition("DRAFT", "SUBMIT")).toBe("SUBMITTED");
    expect(batchTransition("SUBMITTED", "APPROVE")).toBe("FORM_TEACHER_APPROVED");
    expect(batchTransition("SUBMITTED", "REJECT")).toBe("FORM_TEACHER_REJECTED");
    expect(batchTransition("FORM_TEACHER_REJECTED", "SUBMIT")).toBe("SUBMITTED");
  });
  it("a Form Teacher's own entry skips the review step", () => {
    expect(batchTransition("DRAFT", "SUBMIT_AS_FORM_TEACHER")).toBe("FORM_TEACHER_APPROVED");
    expect(batchTransition("FORM_TEACHER_REJECTED", "SUBMIT_AS_FORM_TEACHER")).toBe("FORM_TEACHER_APPROVED");
  });
  it("a subject teacher can take back a submission the Form Teacher has not reviewed yet", () => {
    expect(batchTransition("SUBMITTED", "TAKE_BACK")).toBe("DRAFT");
    expect(batchTransition("FORM_TEACHER_APPROVED", "TAKE_BACK")).toBeNull();
    expect(batchTransition("DRAFT", "TAKE_BACK")).toBeNull();
  });
  it("only approved subjects can be reopened or returned", () => {
    expect(batchTransition("FORM_TEACHER_APPROVED", "REOPEN")).toBe("DRAFT");
    expect(batchTransition("FORM_TEACHER_APPROVED", "RETURN")).toBe("FORM_TEACHER_REJECTED");
    expect(batchTransition("DRAFT", "REOPEN")).toBeNull();
    expect(batchTransition("SUBMITTED", "RETURN")).toBeNull();
  });
  it("cannot approve or reject something never submitted, and cannot submit twice", () => {
    expect(batchTransition("DRAFT", "APPROVE")).toBeNull();
    expect(batchTransition("DRAFT", "REJECT")).toBeNull();
    expect(batchTransition("SUBMITTED", "SUBMIT")).toBeNull();
    expect(batchTransition("FORM_TEACHER_APPROVED", "APPROVE")).toBeNull();
  });
  it("every action is allowed from exactly the states listed, nowhere else", () => {
    const expected: Record<BatchAction, BatchStatus[]> = {
      SUBMIT: ["DRAFT", "FORM_TEACHER_REJECTED"], SUBMIT_AS_FORM_TEACHER: ["DRAFT", "FORM_TEACHER_REJECTED"],
      APPROVE: ["SUBMITTED"], REJECT: ["SUBMITTED"], REOPEN: ["FORM_TEACHER_APPROVED"], RETURN: ["FORM_TEACHER_APPROVED"],
      TAKE_BACK: ["SUBMITTED"],
    };
    for (const action of Object.keys(expected) as BatchAction[]) {
      expect(BATCH_STATES.filter((s) => batchTransition(s, action) !== null).sort()).toEqual([...expected[action]].sort());
    }
  });
  it("unknown statuses are refused", () => {
    expect(batchTransition("PUBLISHED", "SUBMIT")).toBeNull();
    expect(batchTransition("", "APPROVE")).toBeNull();
  });
});

describe("class sheet workflow", () => {
  it("follows the approval chain in order", () => {
    expect(sheetTransition("DRAFT", "SUBMIT")).toBe("ADMIN_REVIEW");
    expect(sheetTransition("ADMIN_REVIEW", "APPROVE")).toBe("ADMIN_APPROVED");
    expect(sheetTransition("ADMIN_APPROVED", "PUBLISH")).toBe("PUBLISHED");
  });
  it("cannot jump to published or publish unapproved results", () => {
    expect(sheetTransition("DRAFT", "PUBLISH")).toBeNull();
    expect(sheetTransition("ADMIN_REVIEW", "PUBLISH")).toBeNull();
    expect(sheetTransition("DRAFT", "APPROVE")).toBeNull();
  });
  it("can be returned, withdrawn and unpublished, each one step back", () => {
    expect(sheetTransition("ADMIN_REVIEW", "RETURN")).toBe("DRAFT");
    expect(sheetTransition("ADMIN_APPROVED", "WITHDRAW")).toBe("ADMIN_REVIEW");
    expect(sheetTransition("PUBLISHED", "UNPUBLISH")).toBe("ADMIN_APPROVED");
    expect(sheetTransition("DRAFT", "UNPUBLISH")).toBeNull();
  });
  it("each action works only from the states listed", () => {
    const expected: Record<SheetAction, SheetStatus[]> = {
      SUBMIT: ["DRAFT"], APPROVE: ["ADMIN_REVIEW"], PUBLISH: ["ADMIN_APPROVED"], UNPUBLISH: ["PUBLISHED"], WITHDRAW: ["ADMIN_APPROVED"],
      RETURN: ["ADMIN_REVIEW", "ADMIN_APPROVED", "PUBLISHED"],
    };
    for (const a of Object.keys(expected) as SheetAction[]) {
      expect(SHEET_STATES.filter((s) => sheetTransition(s, a) !== null).sort()).toEqual([...expected[a]].sort());
    }
  });
  it("an Admin can send a class back for correction even after approving or publishing it", () => {
    expect(sheetTransition("ADMIN_APPROVED", "RETURN")).toBe("DRAFT");
    expect(sheetTransition("PUBLISHED", "RETURN")).toBe("DRAFT");
    expect(sheetTransition("DRAFT", "RETURN")).toBeNull();
  });
});

describe("when scores can be edited", () => {
  it("only while the subject is open and the class has not gone to the Admin", () => {
    expect(canEditBatch("DRAFT", "DRAFT")).toBe(true);
    expect(canEditBatch("FORM_TEACHER_REJECTED", "DRAFT")).toBe(true);
    expect(canEditBatch("SUBMITTED", "DRAFT")).toBe(false);
    expect(canEditBatch("FORM_TEACHER_APPROVED", "DRAFT")).toBe(false);
    expect(canEditBatch("DRAFT", "ADMIN_REVIEW")).toBe(false);
    expect(canEditBatch("DRAFT", "PUBLISHED")).toBe(false);
  });
});
