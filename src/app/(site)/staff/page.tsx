import type { Metadata } from "next";
import { StaffCard } from "@/components/site/cards";
import { PageHero, Section } from "@/components/site/section";
import { getStaff } from "@/lib/cms/site-data";

export const metadata: Metadata = { title: "Our staff", description: "The people who teach and lead our school." };

export default async function StaffPage() {
  const staff = await getStaff();
  return (
    <>
      <PageHero eyebrow="Our staff" title="The people behind the school" />
      <Section>{staff.length === 0 ? <p className="text-muted-foreground">Staff profiles will be added here soon.</p> : <ul className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">{staff.map((p) => <StaffCard key={p.id} person={p} />)}</ul>}</Section>
    </>
  );
}
