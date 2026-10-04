"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/shared/form-message";
import { ActionButton } from "@/components/shared/action-button";
import { useAction } from "@/lib/use-action";
import { approveRequest, rejectRequest } from "./actions";

export function RequestActions({ requestId, name }: { requestId: string; name: string }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const { run, pending, error } = useAction(rejectRequest);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <ActionButton
          action={approveRequest}
          input={{ requestId }}
          label="Approve"
          variant="default"
          confirm={`Approve ${name}? They will be able to sign in straight away.`}
        />
        {!rejecting && (
          <Button type="button" variant="outline" size="sm" onClick={() => setRejecting(true)}>Reject…</Button>
        )}
      </div>
      {rejecting && (
        <form onSubmit={(e) => { e.preventDefault(); run({ requestId, reason }); }} className="flex flex-col gap-2 sm:max-w-md">
          <Input aria-label="Reason for rejecting" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (shown to the teacher by email)" required />
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="destructive" disabled={pending || reason.trim().length < 3}>Confirm rejection</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setRejecting(false)}>Cancel</Button>
          </div>
          <FormMessage error={error} />
        </form>
      )}
    </div>
  );
}
