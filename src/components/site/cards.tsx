import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { EventItem, NewsSummary, StaffMember } from "@/lib/cms/site-queries";
import { plainText } from "@/lib/cms/rich-text";
import { formatDate, formatDateTime } from "@/lib/format";
import { SiteImage } from "./site-image";

export function NewsCard({ post }: { post: NewsSummary }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg">
      <Link href={`/news/article?slug=${post.slug}`} className="block overflow-hidden" tabIndex={-1} aria-hidden="true">
        <SiteImage src={post.coverImageUrl} alt="" width={640} className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.03]" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-xs text-muted-foreground">{post.category ? `${post.category} · ` : ""}{formatDate(new Date(post.publishedAt))}</p>
        <h3 className="font-serif text-xl leading-snug text-navy"><Link href={`/news/article?slug=${post.slug}`} className="hover:underline">{post.title}</Link></h3>
        {post.excerpt && <p className="text-sm text-muted-foreground">{plainText(post.excerpt, 140)}</p>}
        <Link href={`/news/article?slug=${post.slug}`} className="mt-auto pt-2 text-sm font-medium text-primary hover:underline">Read more</Link>
      </div>
    </article>
  );
}

export function EventRow({ event }: { event: EventItem }) {
  const start = new Date(event.startsAt);
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "Africa/Lagos" }).format(start);
  const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: "Africa/Lagos" }).format(start);
  return (
    <li className="flex gap-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-navy py-2 text-white" aria-hidden="true">
        <span className="text-xs uppercase tracking-wider text-white/70">{month}</span>
        <span className="font-serif text-2xl leading-none">{day}</span>
      </div>
      <div className="min-w-0">
        <h3 className="font-serif text-lg text-navy">{event.title}</h3>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" aria-hidden="true" />{formatDateTime(start)}</span>
          {event.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden="true" />{event.location}</span>}
        </p>
        {event.description && <p className="mt-2 text-sm text-foreground/80">{event.description}</p>}
      </div>
    </li>
  );
}

export function StaffCard({ person }: { person: StaffMember }) {
  const initials = person.name.replace(/^(mr|mrs|ms|dr|prof|miss|chief|engr)\.?\s+/i, "").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-card">
      {person.photoUrl ? (
        <SiteImage src={person.photoUrl} alt={person.name} width={480} className="aspect-[4/5] w-full" />
      ) : (
        <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-primary-soft to-accent-soft font-serif text-5xl text-navy/60" aria-hidden="true">{initials}</div>
      )}
      <div className="p-4">
        <h3 className="font-serif text-lg text-navy">{person.name}</h3>
        <p className="text-sm text-accent">{person.position}</p>
        {person.department && <p className="text-xs text-muted-foreground">{person.department}</p>}
        {person.bio && <p className="mt-2 text-sm text-foreground/80">{plainText(person.bio, 140)}</p>}
      </div>
    </li>
  );
}
