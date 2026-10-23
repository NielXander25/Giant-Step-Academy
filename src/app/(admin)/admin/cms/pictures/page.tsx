import type { Metadata } from "next";
import Link from "next/link";
import { PictureSlot } from "@/components/cms/picture-slot";
import { PageHeader } from "@/components/dashboard/page-header";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { BLOCKS, PAGES, type ImageValue } from "@/lib/cms/blocks";
import { loadBlocks } from "@/lib/cms/site-queries";
import { ADMIN_ROLES } from "@/lib/permissions/roles";

export const metadata: Metadata = { title: "Website pictures" };

export default async function PicturesPage() {
  await requireRole(...ADMIN_ROLES);
  const slots = BLOCKS.filter((b) => b.type === "image");
  const [values, school] = await Promise.all([loadBlocks(PAGES.map((p) => p.key)), db.schoolProfile.findUnique({ where: { id: "singleton" }, select: { logoUrl: true } })]);
  const pageName = (k: string) => PAGES.find((p) => p.key === k)?.label ?? k;

  return (
    <>
      <PageHeader title="Website pictures" description="Every main picture on the website in one place. Choose a new picture, press Save, and it is live." />
      <p className="mb-6 text-sm">Pictures for the gallery, news, events and staff are managed with those items. <Link href="/admin/cms/content?type=gallery" className="text-primary underline underline-offset-4">Open the gallery</Link></p>
      <h2 className="mb-3 text-xl text-navy">Logo</h2>
      <div className="mb-8 max-w-2xl">
        <PictureSlot logo label="School logo" where="Header, footer and report cards. Until you upload one, the website draws the crest with the school's name." initial={school?.logoUrl ? { url: school.logoUrl, alt: "" } : null} />
      </div>
      <h2 className="mb-3 text-xl text-navy">Page pictures</h2>
      <div className="grid gap-5 lg:grid-cols-2">
        {slots.map((def) => (
          <PictureSlot key={def.key} label={def.label === "Picture" || def.label === "Photo" ? `${def.group}` : def.label} where={`${pageName(def.page)} page · ${def.group}`} page={def.page} blockKey={def.key} initial={(values[def.key] as ImageValue) ?? null} />
        ))}
      </div>
    </>
  );
}
