import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/site/rich-text";
import { Section } from "@/components/site/section";
import { SiteImage } from "@/components/site/site-image";
import { plainText } from "@/lib/cms/rich-text";
import { getNewsBySlug } from "@/lib/cms/site-data";
import { formatDate } from "@/lib/format";

type Props = { searchParams: Promise<{ slug?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const slug = (await searchParams).slug;
  const post = slug ? await getNewsBySlug(slug) : null;
  return post ? { title: post.title, description: post.excerpt ?? plainText(post.content, 150) } : { title: "News" };
}

export default async function ArticlePage({ searchParams }: Props) {
  const slug = (await searchParams).slug;
  const post = slug && /^[a-z0-9-]{1,80}$/.test(slug) ? await getNewsBySlug(slug) : null;
  if (!post) notFound();
  return (
    <Section>
      <article className="mx-auto max-w-3xl">
        <Link href="/news" className="text-sm text-primary hover:underline">← All news</Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{post.category ?? "News"}</p>
        <h1 className="mt-2 text-4xl text-navy md:text-5xl">{post.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{formatDate(new Date(post.publishedAt))}{post.authorName ? ` · ${post.authorName}` : ""}</p>
        {post.coverImageUrl && <SiteImage src={post.coverImageUrl} alt="" width={1200} priority className="mt-8 aspect-[16/9] w-full rounded-3xl" />}
        <RichText source={post.content} className="mt-8 text-lg" />
      </article>
    </Section>
  );
}
