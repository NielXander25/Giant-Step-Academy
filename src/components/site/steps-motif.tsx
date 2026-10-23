import { cn } from "@/lib/utils";

/** The school's "giant step" idea as a quiet decorative shape: bars rising to the right. */
export function StepsMotif({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const heights = [28, 44, 62, 82, 106];
  return (
    <svg viewBox="0 0 150 110" aria-hidden="true" className={cn("h-auto w-full", className)}>
      {heights.map((h, i) => (
        <rect key={i} x={i * 30 + 2} y={110 - h} width="26" height={h} rx="3" fill={i === 4 ? "var(--accent)" : tone === "light" ? "#ffffff" : "var(--primary)"} opacity={i === 4 ? 1 : 0.12 + i * 0.1} />
      ))}
    </svg>
  );
}
