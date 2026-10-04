import { LogoPlaceholder } from "@/components/brand/logo-placeholder";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Temporary home page for Phase 1. The real public website arrives in Phase 9.
const steps = [
  { h: "h-16", c: "bg-primary/30" },
  { h: "h-28", c: "bg-primary/50" },
  { h: "h-40", c: "bg-primary/70" },
  { h: "h-52", c: "bg-primary" },
  { h: "h-64", c: "bg-accent" },
];

export default function HomePage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2">
      <section className="flex flex-col items-start gap-6">
        <LogoPlaceholder />
        <h1 className="text-5xl text-navy md:text-6xl">Giant Step Academy</h1>
        <p className="max-w-md text-lg text-muted-foreground">
          The school website, results system and staff tools are being built. This page is a temporary placeholder.
        </p>
        <p className="text-muted-foreground">[SCHOOL MOTTO]</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Database ready</Badge>
          <Badge>Theme ready</Badge>
          <Badge variant="accent">Website coming in a later phase</Badge>
        </div>
        <Button asChild variant="outline">
          <Link href="/login">Staff sign in</Link>
        </Button>
      </section>

      <div aria-hidden="true" className="flex h-72 items-end justify-center gap-2 md:justify-end">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`step-rise w-14 rounded-t-md md:w-16 ${s.h} ${s.c}`}
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </main>
  );
}
