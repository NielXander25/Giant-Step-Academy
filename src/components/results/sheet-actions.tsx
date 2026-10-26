"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/shared/form-message";
import { ActionButton } from "@/components/shared/action-button";
import { adminReviewSheetAction, publishSheetAction, submitSheetAction, unpublishSheetAction } from "@/lib/results/actions";
import { useAction } from "@/lib/use-action";

type Props = {
  classId: string;
  status: string;
  /** Reasons the class cannot be sent to the Admin yet. */
  blockers: string[];
  canSubmit: boolean;
  canReview: boolean;
  canPublish: boolean;
  approvedSubjects: { id: string; name: string }[];
};

export function SheetActions({ classId, status, blockers, canSubmit, canReview, canPublish, approvedSubjects }: Props) {
  const [returning, setReturning] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [unpublishing, setUnpublishing] = useState(false);
  const back = useAction(adminReviewSheetAction);
  const unpublish = useAction(unpublishSheetAction);

  if (status === "DRAFT" && canSubmit) {
    return blockers.length ? (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Before this class can go to the Admin:</p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground">{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
      </div>
    ) : (
      <ActionButton action={submitSheetAction} input={{ classId }} label="Send class results to the Admin" variant="default" size="default"
        confirm="Send this class's results to the Admin? Scores and remarks can no longer be changed unless the Admin sends them back." />
    );
  }

  // Sending chosen subjects back to their teachers works under review, after approval and even after publishing.
  const returnForm = returning ? (
    <form onSubmit={(e) => { e.preventDefault(); back.run({ classId, decision: "RETURN", reason, subjectIds: picked }); }} className="flex flex-col gap-3 sm:max-w-md">
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">Which subjects need correcting?</legend>
        {approvedSubjects.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" checked={picked.includes(s.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, s.id] : picked.filter((x) => x !== s.id))} />
            {s.name}
          </label>
        ))}
      </fieldset>
      <Input aria-label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What needs correcting?" required />
      {status === "PUBLISHED" && <p className="text-xs text-muted-foreground">Parents will not be able to open these results until you approve and publish them again.</p>}
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" size="sm" disabled={back.pending || picked.length === 0 || reason.trim().length < 3}>Send back</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setReturning(false)}>Cancel</Button>
      </div>
      <FormMessage error={back.error} />
    </form>
  ) : null;
  const returnButton = canReview && !returning
    ? <Button type="button" variant="outline" onClick={() => { setReturning(true); setUnpublishing(false); }}>Send subjects back for correction…</Button>
    : null;

  if (status === "ADMIN_REVIEW" && canReview) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <ActionButton action={adminReviewSheetAction} input={{ classId, decision: "APPROVE" as const }} label="Approve results" variant="default" size="default" confirm="Approve these results? You can still publish them separately." />
          {returnButton}
        </div>
        {returnForm}
      </div>
    );
  }

  if (status === "ADMIN_APPROVED" && (canPublish || canReview)) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {canPublish && <ActionButton action={publishSheetAction} input={{ classId }} label="Publish results" variant="default" size="default" confirm="Publish these results? Parents with a valid PIN will be able to see them." />}
          {canReview && <ActionButton action={adminReviewSheetAction} input={{ classId, decision: "WITHDRAW" as const }} label="Withdraw approval" confirm="Withdraw the approval and put these results back under review?" />}
          {returnButton}
        </div>
        {returnForm}
      </div>
    );
  }

  if (status === "PUBLISHED" && canPublish) {
    return (
      <div className="flex flex-col gap-3">
        {!unpublishing && !returning ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setUnpublishing(true)}>Unpublish…</Button>
            {returnButton}
          </div>
        ) : unpublishing ? (
          <form onSubmit={(e) => { e.preventDefault(); unpublish.run({ classId, reason }); }} className="flex flex-col gap-2 sm:max-w-md">
            <Input aria-label="Reason for unpublishing" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why are these being unpublished?" required />
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" size="sm" disabled={unpublish.pending || reason.trim().length < 3}>Unpublish</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setUnpublishing(false)}>Cancel</Button>
            </div>
            <FormMessage error={unpublish.error} />
          </form>
        ) : null}
        {returnForm}
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">{status === "DRAFT" ? "Waiting for the class's Form Teacher to send these results in." : "No action needed from you right now."}</p>;
}
