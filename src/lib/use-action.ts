"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/action";

/**
 * Runs a server action from a client component, tracks pending/error state,
 * and refreshes the page data after a success.
 */
export function useAction<I, O>(
  action: (input: I) => Promise<ActionResult<O>>,
  options?: { onSuccess?: (data: O) => void },
) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult<O> | null>(null);

  const run = (input: I) =>
    start(async () => {
      const r = await action(input);
      setResult(r);
      if (r.ok) {
        options?.onSuccess?.(r.data);
        router.refresh();
      }
    });

  return {
    run,
    pending,
    success: result?.ok === true,
    error: result && !result.ok ? result.error : null,
    fieldErrors: result && !result.ok ? (result.fieldErrors ?? {}) : {},
  };
}
