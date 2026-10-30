import type { Metadata } from "next";
import { StaffCard } from "@/components/site/cards";
import { PhotoGrid } from "@/components/site/photo-grid";
import { PageHero, Section, SectionHeading } from "@/components/site/section";
import { getStaff } from "@/lib/cms/site-data";
import { LEADER_PHOTOS, STAFF_PHOTOS } from "@/lib/cms/school-photos";

export const metadata: Metadata = { title: "Our staff", description: "The people who teach and lead our school." };

export default async function StaffPage() {
  const staff = await getStaff();
  return (
    <>
      <PageHero eyebrow="Our staff" title="The people behind the school" />
      {staff.length > 0 && <Section><ul className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">{staff.map((p) => <StaffCard key={p.id} person={p} />)}</ul></Section>}
      <Section>
        <SectionHeading eyebrow="Leadership" title="Leading the school" />
        <PhotoGrid photos={LEADER_PHOTOS} columns="grid-cols-2 md:grid-cols-3" aspect="aspect-[4/5]" />
      </Section>
      <Section tone="soft">
        <SectionHeading eyebrow="Our team" title="Teachers, carers and partners" />
        <PhotoGrid photos={STAFF_PHOTOS} />
      </Section>
    </>
  );
}
