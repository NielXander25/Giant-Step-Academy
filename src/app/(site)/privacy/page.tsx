import type { Metadata } from "next";
import { RichText } from "@/components/site/rich-text";
import { PageHero, Section } from "@/components/site/section";
import { getBlocks } from "@/lib/cms/site-data";

export const metadata: Metadata = { title: "Privacy notice" };

export default async function PrivacyPage() {
  const b = await getBlocks(["privacy"]);
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy notice" />
      <Section><RichText source={b["privacy.body"] as string} className="mx-auto max-w-3xl" /></Section>
    </>
  );
}
