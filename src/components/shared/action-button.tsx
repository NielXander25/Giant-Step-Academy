"use client";

import type { ActionResult } from "@/lib/action";
import { useAction } from "@/lib/use-action";
import { Button, type ButtonProps } from "@/components/ui/button";

type Props<I, O> = {
  action: (input: I) => Promise<ActionResult<O>>;
  input: I;
  label: string;
  pendingLabel?: string;
  /** Asks the user to confirm first (browser dialog). */
  confirm?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
};

/** A button that runs one server action with a fixed input. */
export function ActionButton<I, O>({ action, input, label, pendingLabel, confirm, variant = "outline", size = "sm" }: Props<I, O>) {
  const { run, pending, error } = useAction(action);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          run(input);
        }}
      >
        {pending ? (pendingLabel ?? "Working…") : label}
      </Button>
      {error && <span role="alert" className="max-w-56 text-xs text-destructive">{error}</span>}
    </span>
  );
}
