"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/shared/form-message";
import { ActionButton } from "@/components/shared/action-button";
import { reopenSubjectAction, reviewSubjectAction } from "@/lib/results/actions";
import { useAction } from "@/lib/use-action";

type Props = { classId: string; subjectId: string; canReview: boolean; canReopen: boolean };

export function ReviewActions({ classId, subjectId, canReview, canReopen }: Props) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const reject = useAction(reviewSubjectAction);

  if (!canReview && !canReopen) return null;
  return (
    <div className="flex flex-col gap-3">
      {canReview && (
        <>
          <div className="flex flex-wrap gap-2">
            <ActionButton action={reviewSubjectAction} input={{ classId, subjectId, decision: "APPROVE" as const }} label="Approve these results" variant="default" size="default" confirm="Approve these results?" />
            {!rejecting && <Button type="button" variant="outline" onClick={() => setRejecting(true)}>Send back for correction…</Button>}
          </div>
          {rejecting && (
            <form onSubmit={(e) => { e.preventDefault(); reject.run({ classId, subjectId, decision: "REJECT", reason }); }} className="flex flex-col gap-2 sm:max-w-md">
              <Input aria-label="What needs correcting" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What needs correcting?" required />
              <div className="flex gap-2">
                <Button type="submit" variant="destructive" size="sm" disabled={reject.pending || reason.trim().length < 3}>Send back</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setRejecting(false)}>Cancel</Button>
              </div>
              <FormMessage error={reject.error} />
            </form>
          )}
        </>
      )}
      {canReopen && (
        <ActionButton action={reopenSubjectAction} input={{ classId, subjectId }} label="Reopen for correction" confirm="Reopen these results so scores can be changed again?" />
      )}
    </div>
  );
}
