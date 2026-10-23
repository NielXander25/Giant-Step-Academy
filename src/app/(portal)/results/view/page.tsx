import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AlertTriangle, Download } from "lucide-react";
import { PrintButton } from "@/components/portal/print-button";
import { ResultSheet } from "@/components/portal/result-sheet";
import { findViewSession } from "@/lib/pin/access";
import { loadPublishedResult } from "@/lib/pin/result-data";
import { VIEW_COOKIE } from "@/lib/pin/view-session";

export const metadata: Metadata = { title: "Result", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const time = new Intl.DateTimeFormat("en-GB", { timeStyle: "short", timeZone: "Africa/Lagos" });

export default async function ViewResultPage() {
  const token = (await cookies()).get(VIEW_COOKIE)?.value;
  if (!token) redirect("/results");

  // Reloading or printing here is free: the attempt was used when the result first opened.
  const pass = await findViewSession(token);
  if (!pass) redirect("/results?expired=1");

  const data = await loadPublishedResult(pass.studentId, pass.termId);
  if (!data) {
    return (
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl text-navy">Result not available</h1>
        <p className="mt-2 text-muted-foreground">This result is not available right now. Please contact the school office.</p>
        <p className="mt-6"><Link href="/results" className="text-primary underline underline-offset-4">Back</Link></p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 print:p-0">
      <div className="mb-6 flex flex-col gap-4 print:hidden">
        <div role="alert" className="flex gap-3 rounded-xl border border-accent bg-accent-soft p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <p className="font-medium">This result view counts as one of your two available attempts. Please download or save your result before leaving this page.</p>
            <p className="mt-1 text-muted-foreground">
              Attempt {pass.attemptsUsed} of {pass.maxUses} used on this PIN. You can reload or print this page until {time.format(pass.expiresAt)} without using another attempt.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/api/results/pdf" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-navy">
            <Download className="size-4" aria-hidden="true" /> Download PDF
          </a>
          <PrintButton />
          <Link href="/results" className="inline-flex h-10 items-center rounded-lg border border-input px-4 text-sm hover:bg-primary-soft">Close</Link>
        </div>
      </div>
      <ResultSheet data={data} />
    </main>
  );
}
