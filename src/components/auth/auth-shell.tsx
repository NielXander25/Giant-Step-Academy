import Link from "next/link";
import { CrestMark } from "@/components/site/school-logo";

/** The staff sign-in pages: cream page, the school's crest and name, and one large white card. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-cream px-5 py-10 sm:py-16">
      <Link href="/" className="mb-8 flex items-center gap-4" aria-label="Giant Step Academy home">
        <span className="flex size-16 items-center justify-center rounded-2xl border border-border bg-white shadow-sm">
          <CrestMark size={40} />
        </span>
        <span className="font-serif text-2xl font-bold text-navy sm:text-3xl">Giant Step Academy</span>
      </Link>
      <div className="w-full max-w-md rounded-[2rem] border border-border bg-white px-7 py-9 shadow-[0_20px_60px_-30px_rgba(20,42,76,0.35)] sm:px-10 sm:py-11">
        <h1 className="text-4xl text-navy sm:text-[2.75rem]">{title}</h1>
        {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </main>
  );
}

/** Uppercase field label, as on the sign-in card. */
export function AuthLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="text-xs font-extrabold uppercase tracking-[0.14em] text-navy">{children}</label>;
}

/** Field classes for the sign-in card: tall, rounded and roomy. */
export const authField = "h-14 rounded-2xl px-5 text-base";
