// The result approval chain as a small state machine. Pure and fully tested.
//
//   Subject results (one subject, one class, one term)
//     DRAFT ──submit──► SUBMITTED ──approve──► FORM_TEACHER_APPROVED
//       ▲    ◄─take back─┘  │ reject                  │ reopen (before the class goes to the Admin)
//       │                   ▼                         ▼
//       └──── resubmit ── FORM_TEACHER_REJECTED     DRAFT
//     A Form Teacher's own entries skip the review step: DRAFT ──► FORM_TEACHER_APPROVED.
//
//   Class sheet (one class, one term)
//     DRAFT ──submit──► ADMIN_REVIEW ──approve──► ADMIN_APPROVED ──publish──► PUBLISHED
//       ▲                    │ return (chosen subjects reopened)      │ withdraw     │ unpublish
//       └────────────────────┘                                        ▼              ▼
//                                                                ADMIN_REVIEW   ADMIN_APPROVED
//     An Admin can also return a class for correction from ADMIN_APPROVED or PUBLISHED (unpublishing it).

export type BatchStatus = "DRAFT" | "SUBMITTED" | "FORM_TEACHER_APPROVED" | "FORM_TEACHER_REJECTED";
export type BatchAction = "SUBMIT" | "SUBMIT_AS_FORM_TEACHER" | "APPROVE" | "REJECT" | "REOPEN" | "RETURN" | "TAKE_BACK";

const BATCH: Record<BatchAction, { from: BatchStatus[]; to: BatchStatus }> = {
  SUBMIT: { from: ["DRAFT", "FORM_TEACHER_REJECTED"], to: "SUBMITTED" },
  SUBMIT_AS_FORM_TEACHER: { from: ["DRAFT", "FORM_TEACHER_REJECTED"], to: "FORM_TEACHER_APPROVED" },
  APPROVE: { from: ["SUBMITTED"], to: "FORM_TEACHER_APPROVED" },
  REJECT: { from: ["SUBMITTED"], to: "FORM_TEACHER_REJECTED" },
  REOPEN: { from: ["FORM_TEACHER_APPROVED"], to: "DRAFT" },
  RETURN: { from: ["FORM_TEACHER_APPROVED"], to: "FORM_TEACHER_REJECTED" },
  // The subject teacher pulls their own submission back to fix a mistake, before the Form Teacher reviews it.
  TAKE_BACK: { from: ["SUBMITTED"], to: "DRAFT" },
};

export const batchFrom = (action: BatchAction) => BATCH[action].from;

/** The status after an action, or null if the action is not allowed from the current status. */
export function batchTransition(status: string, action: BatchAction): BatchStatus | null {
  const rule = BATCH[action];
  return (rule.from as string[]).includes(status) ? rule.to : null;
}

export type SheetStatus = "DRAFT" | "ADMIN_REVIEW" | "ADMIN_APPROVED" | "PUBLISHED";
export type SheetAction = "SUBMIT" | "APPROVE" | "RETURN" | "PUBLISH" | "UNPUBLISH" | "WITHDRAW";

const SHEET: Record<SheetAction, { from: SheetStatus[]; to: SheetStatus }> = {
  SUBMIT: { from: ["DRAFT"], to: "ADMIN_REVIEW" },
  APPROVE: { from: ["ADMIN_REVIEW"], to: "ADMIN_APPROVED" },
  // Sending chosen subjects back for correction works at any stage after the Form Teacher has sent the class in.
  RETURN: { from: ["ADMIN_REVIEW", "ADMIN_APPROVED", "PUBLISHED"], to: "DRAFT" },
  PUBLISH: { from: ["ADMIN_APPROVED"], to: "PUBLISHED" },
  UNPUBLISH: { from: ["PUBLISHED"], to: "ADMIN_APPROVED" },
  WITHDRAW: { from: ["ADMIN_APPROVED"], to: "ADMIN_REVIEW" },
};

export const sheetFrom = (action: SheetAction) => SHEET[action].from;

export function sheetTransition(status: string, action: SheetAction): SheetStatus | null {
  return (SHEET[action].from as string[]).includes(status) ? SHEET[action].to : null;
}

/** Scores can only be changed while the subject is open AND the class has not gone to the Admin. */
export function canEditBatch(batchStatus: string, sheetStatus: string): boolean {
  return (batchStatus === "DRAFT" || batchStatus === "FORM_TEACHER_REJECTED") && sheetStatus === "DRAFT";
}

export type Tone = "outline" | "accent" | "success" | "destructive";

export const BATCH_LABEL: Record<BatchStatus, { text: string; variant: Tone }> = {
  DRAFT: { text: "Draft", variant: "outline" },
  SUBMITTED: { text: "Waiting for Form Teacher", variant: "accent" },
  FORM_TEACHER_APPROVED: { text: "Approved", variant: "success" },
  FORM_TEACHER_REJECTED: { text: "Needs correction", variant: "destructive" },
};

export const SHEET_LABEL: Record<SheetStatus, { text: string; variant: Tone }> = {
  DRAFT: { text: "Being prepared", variant: "outline" },
  ADMIN_REVIEW: { text: "With the Admin", variant: "accent" },
  ADMIN_APPROVED: { text: "Approved, not published", variant: "success" },
  PUBLISHED: { text: "Published", variant: "success" },
};

/** Status values the database may hold that this workflow does not use are shown as drafts. */
export const asBatchStatus = (s: string): BatchStatus => (s in BATCH_LABEL ? (s as BatchStatus) : "DRAFT");
export const asSheetStatus = (s: string): SheetStatus => (s in SHEET_LABEL ? (s as SheetStatus) : "DRAFT");
