import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { CrestMark } from "@/components/site/school-logo";
import { optimizeImage } from "@/lib/cms/helpers";
import { db } from "@/lib/db";
import { isSampleEnabled, SAMPLE_TERM } from "@/lib/pin/sample-access";
import { ResultForm } from "./result-form";

export const metadata: Metadata = { title: "Check results", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  const [school, terms, sample] = await Promise.all([
    db.schoolProfile.findUnique({ where: { id: "singleton" }, select: { name: true, logoUrl: true } }),
    db.term.findMany({
      where: { classSheets: { some: { status: "PUBLISHED" } } },
      include: { session: { select: { name: true } } },
      orderBy: [{ session: { name: "desc" } }, { sortOrder: "desc" }],
    }),
    isSampleEnabled(),
  ]);
  const options = terms.map((t) => ({ id: t.id, label: `${t.session.name} · ${t.name}` }));
  // Before any result is published, the practice result still needs a term to choose.
  if (options.length === 0 && sample) options.push({ id: SAMPLE_TERM, label: "Practice term (sample result)" });

  const name = school?.name ?? "Giant Step Academy";
  const logo = optimizeImage(school?.logoUrl, 320);

  return (
    <main className="relative min-h-screen overflow-hidden bg-muted px-5 py-12 sm:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 size-[28rem] rounded-full bg-sky/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-32 size-[28rem] rounded-full bg-sun/30 blur-3xl" />

      <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
        <Link href="/" aria-label={`${name} home`} className="flex size-28 items-center justify-center rounded-[2rem] bg-white shadow-[0_12px_40px_-16px_rgba(0,0,0,0.25)]">
          {logo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={logo} alt={name} className="max-h-20 max-w-20 object-contain" />
            : <CrestMark size={80} title={name} />}
        </Link>
        <p className="mt-6 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">{name}</p>
        <span aria-hidden="true" className="mt-3 h-1.5 w-14 rounded-full bg-sun" />
        <h1 className="mt-6 text-4xl text-navy sm:text-5xl">Check your child&apos;s result</h1>
        <p className="mt-3 text-lg text-muted-foreground">Enter the details exactly as the school gave them. No account is needed.</p>
      </div>

      <div className="relative mx-auto mt-8 max-w-md">
        {expired && <p role="status" className="mb-4 rounded-2xl bg-sun/25 px-4 py-3 text-sm text-navy">Your viewing time ended. Enter the details again to reopen the result. This may use another attempt on the PIN.</p>}

        <div className="rounded-[2rem] bg-white p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.3)] sm:p-9">
          {options.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary"><CalendarClock className="size-7" aria-hidden="true" /></span>
              <p className="mt-4 text-xl font-semibold text-navy">No results yet</p>
              <p className="mt-1 text-muted-foreground">Results have not been published yet. Please check back later.</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl text-navy">Open a result</h2>
              <p className="mb-6 mt-1 text-muted-foreground">You will need the result PIN from the school office.</p>
              <ResultForm terms={options} />
            </>
          )}
        </div>
        <p className="mt-8 text-center text-sm"><Link href="/" className="font-medium text-primary hover:underline">← Back to the school website</Link></p>
      </div>
    </main>
  );
}
