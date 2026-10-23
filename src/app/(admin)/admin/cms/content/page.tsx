import type { Metadata } from "next";
import Link from "next/link";
import { ContentForm, GalleryUploader } from "@/components/cms/content-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireRole } from "@/lib/auth/session";
import { deleteContentAction } from "@/lib/cms/actions";
import { toLagosInput } from "@/lib/cms/helpers";
import { MODULES } from "@/lib/cms/modules";
import { plainText } from "@/lib/cms/rich-text";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { CONTENT_TYPES, type ContentType } from "@/lib/validators/cms";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Website content" };

type Row = { id: string; title: string; meta: string; status: string; isDemo: boolean };
const clip = (s: string | null | undefined, n = 80) => plainText(s ?? "", n);

async function loadRows(type: ContentType): Promise<Row[]> {
  switch (type) {
    case "news": return (await db.newsPost.findMany({ orderBy: { createdAt: "desc" }, take: 200 })).map((r) => ({ id: r.id, title: r.title, meta: [r.category, r.publishedAt ? formatDate(r.publishedAt) : "not published"].filter(Boolean).join(" · "), status: r.status, isDemo: r.isDemo }));
    case "events": return (await db.schoolEvent.findMany({ orderBy: { startsAt: "desc" }, take: 200 })).map((r) => ({ id: r.id, title: r.title, meta: formatDateTime(r.startsAt), status: r.status, isDemo: r.isDemo }));
    case "gallery": return (await db.galleryItem.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take: 200 })).map((r) => ({ id: r.id, title: r.caption || "Picture", meta: r.category ?? "No group", status: r.status, isDemo: r.isDemo }));
    case "staff": return (await db.staffProfile.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], take: 200 })).map((r) => ({ id: r.id, title: r.name, meta: r.position, status: r.status, isDemo: r.isDemo }));
    case "announcements": return (await db.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 100 })).map((r) => ({ id: r.id, title: r.title, meta: clip(r.message), status: r.status, isDemo: r.isDemo }));
    default: return (await db.testimonial.findMany({ orderBy: { createdAt: "desc" }, take: 100 })).map((r) => ({ id: r.id, title: r.name, meta: clip(r.quote), status: r.status, isDemo: r.isDemo }));
  }
}

const s = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));

async function loadForm(type: ContentType, id: string): Promise<Record<string, string> | null> {
  switch (type) {
    case "news": { const r = await db.newsPost.findUnique({ where: { id } }); return r && { title: r.title, slug: r.slug, excerpt: s(r.excerpt), content: r.content, coverImageUrl: s(r.coverImageUrl), category: s(r.category), authorName: s(r.authorName), status: r.status }; }
    case "events": { const r = await db.schoolEvent.findUnique({ where: { id } }); return r && { title: r.title, description: s(r.description), location: s(r.location), startsAt: toLagosInput(r.startsAt), endsAt: toLagosInput(r.endsAt), imageUrl: s(r.imageUrl), status: r.status }; }
    case "gallery": { const r = await db.galleryItem.findUnique({ where: { id } }); return r && { imageUrl: r.imageUrl, caption: s(r.caption), category: s(r.category), sortOrder: s(r.sortOrder), status: r.status }; }
    case "staff": { const r = await db.staffProfile.findUnique({ where: { id } }); return r && { name: r.name, position: r.position, department: s(r.department), photoUrl: s(r.photoUrl), bio: s(r.bio), sortOrder: s(r.sortOrder), status: r.status }; }
    case "announcements": { const r = await db.announcement.findUnique({ where: { id } }); return r && { title: r.title, message: r.message, startsAt: toLagosInput(r.startsAt), endsAt: toLagosInput(r.endsAt), status: r.status }; }
    default: { const r = await db.testimonial.findUnique({ where: { id } }); return r && { name: r.name, relationship: s(r.relationship), quote: r.quote, photoUrl: s(r.photoUrl), status: r.status }; }
  }
}

const BLANK: Record<ContentType, Record<string, string>> = {
  news: { status: "DRAFT" }, events: { status: "PUBLISHED" }, gallery: { sortOrder: "0", status: "PUBLISHED" },
  staff: { sortOrder: "0", status: "PUBLISHED" }, announcements: { status: "PUBLISHED" }, testimonials: { status: "DRAFT" },
};

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ type?: string; edit?: string; new?: string }> }) {
  await requireRole(...ADMIN_ROLES);
  const sp = await searchParams;
  const type = (CONTENT_TYPES.find((t) => t === sp.type) ?? "news") as ContentType;
  const mod = MODULES[type];
  const editing = sp.edit && /^[0-9a-f-]{36}$/i.test(sp.edit) ? await loadForm(type, sp.edit) : null;
  const rows = await loadRows(type);
  const showForm = Boolean(editing) || sp.new === "1";

  return (
    <>
      <PageHeader title={mod.label} description={mod.intro} />
      <div className="mb-6 flex flex-wrap gap-2" role="navigation" aria-label="Content types">
        {CONTENT_TYPES.map((t) => <Link key={t} href={`/admin/cms/content?type=${t}`} className={cn("rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-primary-soft", t === type && "border-primary bg-primary text-primary-foreground hover:bg-primary")}>{MODULES[t].label}</Link>)}
      </div>

      {showForm ? (
        <Card className="mb-8">
          <CardHeader><CardTitle>{editing ? `Edit ${mod.singular}` : `Add a ${mod.singular}`}</CardTitle></CardHeader>
          <CardContent><ContentForm key={sp.edit ?? "new"} type={type} fields={mod.fields} initial={editing ?? BLANK[type]} id={editing ? sp.edit : undefined} /></CardContent>
        </Card>
      ) : (
        <div className="mb-8 flex flex-col gap-4">
          <div><Button asChild><Link href={`/admin/cms/content?type=${type}&new=1`}>Add a {mod.singular}</Link></Button></div>
          {type === "gallery" && <GalleryUploader />}
        </div>
      )}

      {rows.length === 0 ? <EmptyState title={`No ${mod.label.toLowerCase()} yet`}>Add the first one above.</EmptyState> : (
        <Card><CardContent className="p-2 sm:p-4">
          <Table>
            <THead><TR><TH>{type === "gallery" ? "Caption" : "Title"}</TH><TH>Details</TH><TH>Status</TH><TH><span className="sr-only">Actions</span></TH></TR></THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="font-medium">{r.title}{r.isDemo && <Badge variant="outline" className="ml-2">Sample</Badge>}</TD>
                  <TD className="text-muted-foreground">{r.meta}</TD>
                  <TD>{r.status === "PUBLISHED" ? <Badge variant="success">Published</Badge> : <Badge variant="outline">Draft</Badge>}</TD>
                  <TD className="text-right"><span className="inline-flex items-center gap-2">
                    <Button asChild size="sm" variant="outline"><Link href={`/admin/cms/content?type=${type}&edit=${r.id}`}>Edit</Link></Button>
                    <ActionButton action={deleteContentAction} input={{ type, id: r.id }} label="Delete" confirm={`Delete "${r.title}"? This cannot be undone.`} />
                  </span></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent></Card>
      )}
    </>
  );
}
