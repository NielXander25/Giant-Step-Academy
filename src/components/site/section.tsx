import { cn } from "@/lib/utils";

export function Section({ children, tone = "white", className, id }: { children: React.ReactNode; tone?: "white" | "soft" | "navy" | "sand"; className?: string; id?: string }) {
  const bg = { white: "bg-background", soft: "bg-muted", navy: "bg-navy text-white", sand: "bg-accent-soft" }[tone];
  return (
    <section id={id} className={cn("scroll-mt-24 py-14 md:py-20", bg, className)}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, intro, tone = "light", className }: { eyebrow?: string; title: string; intro?: string; tone?: "light" | "dark"; className?: string }) {
  return (
    <div className={cn("mb-10 max-w-2xl", className)}>
      {eyebrow && <p className={cn("mb-2 text-xs font-semibold uppercase tracking-[0.18em]", tone === "dark" ? "text-white/70" : "text-accent")}>{eyebrow}</p>}
      <h2 className={cn("text-3xl md:text-4xl", tone === "dark" ? "text-white" : "text-navy")}>{title}</h2>
      {intro && <p className={cn("mt-3 text-lg", tone === "dark" ? "text-white/80" : "text-muted-foreground")}>{intro}</p>}
    </div>
  );
}

/** The top of every inner page. */
export function PageHero({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <div className="relative overflow-hidden bg-navy text-white">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
        {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{eyebrow}</p>}
        <h1 className="fade-up max-w-3xl text-4xl md:text-5xl">{title}</h1>
        {intro && <p className="fade-up mt-4 max-w-2xl text-lg text-white/80">{intro}</p>}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-2 right-4 hidden w-56 opacity-60 md:block">
        <svg viewBox="0 0 150 110"><g fill="#fff">{[28, 44, 62, 82, 106].map((h, i) => <rect key={i} x={i * 30 + 2} y={110 - h} width="26" height={h} rx="3" opacity={0.06 + i * 0.04} />)}</g></svg>
      </div>
    </div>
  );
}
