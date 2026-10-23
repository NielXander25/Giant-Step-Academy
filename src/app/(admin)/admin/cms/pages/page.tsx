import type { Metadata } from "next";
import Link from "next/link";
import { BlockEditor } from "@/components/cms/block-editor";
import { PageHeader } from "@/components/dashboard/page-header";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { PAGES, blocksFor, type PageKey } from "@/lib/cms/blocks";
import { loadBlocks } from "@/lib/cms/site-queries";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Page text" };

export default async function PagesEditor({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireRole(...ADMIN_ROLES);
  const sp = await searchParams;
  const page = (PAGES.find((p) => p.key === sp.page) ?? PAGES[0]);
  const defs = blocksFor(page.key as PageKey);
  const [initial, savedRows] = await Promise.all([loadBlocks([page.key as PageKey]), db.pageContent.findMany({ where: { key: { in: defs.map((d) => d.key) } }, select: { key: true } })]);

  return (
    <>
      <PageHeader title="Page text" description="Change the words and pictures on each page. Anything you have not changed shows sample text." />
      <div className="mb-6 flex flex-wrap gap-2" role="navigation" aria-label="Pages">
        {PAGES.map((p) => <Link key={p.key} href={`/admin/cms/pages?page=${p.key}`} className={cn("rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-primary-soft", p.key === page.key && "border-primary bg-primary text-primary-foreground hover:bg-primary")}>{p.label}</Link>)}
      </div>
      <p className="mb-4 text-sm"><a href={page.path} target="_blank" rel="noopener" className="text-primary underline underline-offset-4">View the {page.label} page on the website ↗</a></p>
      <BlockEditor key={page.key} page={page.key} defs={defs} initial={initial} saved={savedRows.map((r) => r.key)} />
    </>
  );
}
