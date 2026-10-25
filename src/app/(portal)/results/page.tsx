import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { isSampleEnabled, SAMPLE_TERM } from "@/lib/pin/sample-access";
import { ResultForm } from "./result-form";

export const metadata: Metadata = { title: "Check results", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  const [school, terms, sample] = await Promise.all([
    db.schoolProfile.findUnique({ where: { id: "singleton" }, select: { name: true } }),
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

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <p className="font-serif text-xl text-navy">{school?.name ?? "Giant Step Academy"}</p>
      <h1 className="mt-4 text-4xl text-navy">Check your child's result</h1>
      <p className="mb-6 mt-2 text-muted-foreground">Enter the details exactly as the school gave them. No account is needed.</p>

      {expired && <p role="status" className="mb-4 rounded-lg bg-accent-soft px-3 py-2 text-sm">Your viewing time ended. Enter the details again to reopen the result. This may use another attempt on the PIN.</p>}

      <Card>
        <CardHeader>
          <CardTitle>Open a result</CardTitle>
          <CardDescription>You will need the result PIN from the school office.</CardDescription>
        </CardHeader>
        <CardContent>
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">No results have been published yet. Please check back later.</p>
          ) : (
            <ResultForm terms={options} />
          )}
        </CardContent>
      </Card>
      <p className="mt-6 text-sm text-muted-foreground"><Link href="/" className="text-primary underline underline-offset-4">Back to the school website</Link></p>
    </main>
  );
}
