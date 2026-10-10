"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/shared/form-message";
import { useAction } from "@/lib/use-action";
import { approveBatch, cancelBatch, rejectBatch, submitBatch } from "@/lib/students/actions";

type Props = {
  batchId: string;
  mode: "SUBMIT" | "WAITING" | "REVIEW" | "NONE";
  importable: number;
  skipped: number;
  /** Where to go after cancelling. */
  listPath: string;
  /** True when submitting means asking the Form Teacher for approval rather than importing right away. */
  needsApproval: boolean;
};

export function BatchActions({ batchId, mode, importable, skipped, listPath, needsApproval }: Props) {
  const router = useRouter();
  const submit = useAction(submitBatch);
  const cancel = useAction(cancelBatch, { onSuccess: () => router.push(listPath) });
  const approve = useAction(approveBatch);
  const reject = useAction(rejectBatch);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const skipNote = skipped > 0 ? ` ${skipped} row${skipped === 1 ? "" : "s"} with problems will be skipped.` : "";

  if (mode === "NONE") return null;

  if (mode === "WAITING") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Waiting for the class's Form Teacher to review this upload.</p>
        <div><Button variant="outline" disabled={cancel.pending} onClick={() => cancel.run({ batchId })}>Cancel upload</Button></div>
        <FormMessage error={cancel.error} />
      </div>
    );
  }

  if (mode === "REVIEW") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Approving adds {importable} student{importable === 1 ? "" : "s"} to the class.{skipNote}</p>
        <div className="flex flex-wrap gap-2">
          <Button disabled={approve.pending || importable === 0} onClick={() => approve.run({ batchId })}>
            {approve.pending ? "Importing…" : `Approve and add ${importable}`}
          </Button>
          {!rejecting && <Button variant="outline" onClick={() => setRejecting(true)}>Reject…</Button>}
        </div>
        {rejecting && (
          <form onSubmit={(e) => { e.preventDefault(); reject.run({ batchId, reason }); }} className="flex flex-col gap-2 sm:max-w-md">
            <Input aria-label="Reason for rejecting" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (the uploader will see this)" required />
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" size="sm" disabled={reject.pending || reason.trim().length < 3}>Confirm rejection</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setRejecting(false)}>Cancel</Button>
            </div>
          </form>
        )}
        <FormMessage error={approve.error ?? reject.error} />
      </div>
    );
  }

  // SUBMIT (uploader reviewing their own draft)
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {importable === 0
          ? "There is nothing to import. Fix the file and upload it again."
          : needsApproval
            ? `This will send ${importable} student${importable === 1 ? "" : "s"} to the class's Form Teacher for approval.${skipNote}`
            : `This will add ${importable} student${importable === 1 ? "" : "s"} to the class now.${skipNote}`}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={submit.pending || importable === 0} onClick={() => submit.run({ batchId })}>
          {submit.pending ? "Working…" : needsApproval ? "Submit for approval" : `Import ${importable} student${importable === 1 ? "" : "s"}`}
        </Button>
        <Button variant="outline" disabled={cancel.pending} onClick={() => cancel.run({ batchId })}>Cancel</Button>
      </div>
      <FormMessage error={submit.error ?? cancel.error} />
    </div>
  );
}
