import { cn } from "@/lib/utils";

/** Stand-in for the official logo. Replace with the real logo when supplied. */
export function LogoPlaceholder({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="School logo placeholder"
      className={cn(
        "inline-flex items-center gap-3 rounded-lg border border-dashed border-input px-3 py-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <rect x="2" y="18" width="6" height="8" fill="var(--primary)" />
        <rect x="8" y="12" width="6" height="14" fill="var(--primary)" opacity="0.8" />
        <rect x="14" y="6" width="6" height="20" fill="var(--primary)" opacity="0.6" />
        <rect x="20" y="2" width="6" height="24" fill="var(--accent)" />
      </svg>
      <span>[GIANT STEP ACADEMY LOGO]</span>
    </div>
  );
}
