import { cn } from "@/lib/utils";

export function Section({ children, tone = "white", className, id }: { children: React.ReactNode; tone?: "white" | "soft" | "navy" | "sand"; className?: string; id?: string }) {
  const bg = { white: "bg-background", soft: "bg-muted", navy: "bg-navy text-white", sand: "bg-primary-soft" }[tone];
  return (
    <section id={id} className={cn("scroll-mt-24 py-16 md:py-24", bg, className)}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, intro, tone = "light", className }: { eyebrow?: string; title: string; intro?: string; tone?: "light" | "dark"; className?: string }) {
  return (
    <div className={cn("mb-10 max-w-2xl", className)}>
      {eyebrow && <p className={cn("mb-3 text-sm font-semibold", tone === "dark" ? "text-white/70" : "text-primary")}>{eyebrow}</p>}
      <h2 className={cn("text-4xl md:text-5xl", tone === "dark" ? "text-white" : "text-navy")}>{title}</h2>
      {intro && <p className={cn("mt-4 text-xl leading-relaxed", tone === "dark" ? "text-white/80" : "text-muted-foreground")}>{intro}</p>}
    </div>
  );
}

/** The top of every inner page. */
export function PageHero({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <div className="relative overflow-hidden bg-muted">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-sky/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-1/3 size-72 rounded-full bg-grape/15 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
        {eyebrow && <p className="mb-3 text-sm font-semibold text-primary">{eyebrow}</p>}
        <h1 className="fade-up max-w-3xl text-5xl text-navy md:text-6xl">{title}</h1>
        {intro && <p className="fade-up mt-5 max-w-2xl text-xl leading-relaxed text-muted-foreground">{intro}</p>}
      </div>
    </div>
  );
}
