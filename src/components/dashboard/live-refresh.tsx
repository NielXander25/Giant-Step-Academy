"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const EVERY_MS = 20_000;

/** True while someone is typing, so a refresh never interrupts them. */
function isEditing() {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

/**
 * Keeps dashboard pages up to date without a manual refresh: new teacher requests, submitted results and the like
 * appear on their own. Fetches fresh data every 20 seconds while the tab is open, and at once when someone comes
 * back to the tab. Unsaved typing is kept: a refresh only swaps in new server data and is skipped while a field
 * has focus.
 */
export function LiveRefresh() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && !isEditing()) router.refresh();
    };
    const timer = window.setInterval(refresh, EVERY_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, [router]);
  return null;
}
