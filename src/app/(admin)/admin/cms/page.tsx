import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Image as ImageIcon, Images, Inbox, Megaphone, Newspaper, CalendarDays, Quote, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { loadSampleAction, removeSampleAction } from "@/lib/cms/actions";
import { demoCounts } from "@/lib/cms/service";
import { ADMIN_ROLES } from "@/lib/permissions/roles";

export const metadata: Metadata = { title: "Website content" };

const TILES = [
  { href: "/admin/cms/pictures", icon: ImageIcon, title: "Pictures", text: "Change the logo and every main picture on the website." },
  { href: "/admin/cms/pages", icon: FileText, title: "Page text", text: "Edit the words on Home, About, Academics, Admissions and more." },
  { href: "/admin/cms/content?type=news", icon: Newspaper, title: "News", text: "Write and publish articles." },
  { href: "/admin/cms/content?type=events", icon: CalendarDays, title: "Events", text: "Add dates for open days, sports and ceremonies." },
  { href: "/admin/cms/content?type=gallery", icon: Images, title: "Gallery", text: "Upload pictures of school life." },
  { href: "/admin/cms/content?type=staff", icon: Users, title: "Staff", text: "Add staff photos and profiles." },
  { href: "/admin/cms/content?type=announcements", icon: Megaphone, title: "Announcements", text: "A notice bar across the top of the site." },
  { href: "/admin/cms/content?type=testimonials", icon: Quote, title: "Testimonials", text: "Words from parents (with permission)." },
];

export default async function CmsHub() {
  await requireRole(...ADMIN_ROLES);
  const [demo, newEnquiries, hasNews] = await Promise.all([demoCounts(), db.enquiry.count({ where: { status: "NEW" } }), db.newsPost.count()]);

  return (
    <>
      <PageHeader title="Website content" description="Everything on the public website can be changed here. Changes appear straight away." />
      {demo.total > 0 && (
        <p className="mb-6 rounded-lg bg-accent-soft px-3 py-2 text-sm">Sample content ({demo.news} articles, {demo.events} events, {demo.staff} staff) is showing on the website. Replace it with the school's own, or remove it all below.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className="group rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
            <t.icon className="size-6 text-accent" aria-hidden="true" /><h2 className="mt-3 font-serif text-xl text-navy">{t.title}</h2><p className="mt-1 text-sm text-muted-foreground">{t.text}</p>
          </Link>
        ))}
        <Link href="/admin/cms/enquiries" className="group rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
          <Inbox className="size-6 text-accent" aria-hidden="true" /><h2 className="mt-3 flex items-center gap-2 font-serif text-xl text-navy">Enquiries {newEnquiries > 0 && <Badge variant="accent">{newEnquiries} new</Badge>}</h2><p className="mt-1 text-sm text-muted-foreground">Messages from the website's contact form.</p>
        </Link>
      </div>
      <Card className="mt-8">
        <CardHeader><CardTitle>Sample content</CardTitle><CardDescription>Fictional articles, events and staff so the site looks complete while real material is collected. No testimonials are ever invented.</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {!hasNews && <ActionButton action={loadSampleAction} input={{}} label="Load sample content" variant="default" size="default" />}
          {demo.total > 0 && <ActionButton action={removeSampleAction} input={{}} label="Remove all sample content" confirm="Remove every sample article, event, staff profile and notice? Content you wrote yourself is kept." />}
          {hasNews > 0 && demo.total === 0 && <p className="text-sm text-muted-foreground">No sample content on the site.</p>}
        </CardContent>
      </Card>
    </>
  );
}
