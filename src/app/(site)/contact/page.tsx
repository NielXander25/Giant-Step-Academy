import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { PageHero, Section } from "@/components/site/section";
import { isPlaceholder, mapsHref, splitPhones, telHref, whatsappHref } from "@/lib/cms/helpers";
import { getBlocks, getSchool } from "@/lib/cms/site-data";

export const metadata: Metadata = { title: "Contact us", description: "Visit, call or message the school." };

export default async function ContactPage() {
  const [b, school] = await Promise.all([getBlocks(["contact"]), getSchool()]);
  const address = isPlaceholder(school.address) ? null : school.address;
  const email = isPlaceholder(school.email) ? null : school.email;
  const phones = splitPhones(school.phone);
  const hours = b["contact.hours"] as string;
  const map = mapsHref(address);
  const row = "flex gap-4 rounded-2xl border border-border bg-card p-5";
  return (
    <>
      <PageHero eyebrow="Contact" title="We'd love to hear from you" intro={b["contact.intro"] as string} />
      <Section>
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            {address && <div className={row}><MapPin className="mt-1 size-5 shrink-0 text-accent" aria-hidden="true" /><div><p className="font-medium text-navy">Visit us</p><p className="text-muted-foreground">{address}</p>{map && <a href={map} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-primary hover:underline">Open in Maps</a>}</div></div>}
            {phones.map((p) => (
              <div key={p} className={row}><Phone className="mt-1 size-5 shrink-0 text-accent" aria-hidden="true" /><div><p className="font-medium text-navy">{p}</p><p className="mt-1 flex gap-4 text-sm"><a href={telHref(p)} className="text-primary hover:underline">Call</a><a href={whatsappHref(p)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><MessageCircle className="size-3.5" aria-hidden="true" />WhatsApp</a></p></div></div>
            ))}
            {email && <div className={row}><Mail className="mt-1 size-5 shrink-0 text-accent" aria-hidden="true" /><div><p className="font-medium text-navy">Email</p><a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a></div></div>}
            {hours && <div className={row}><Clock className="mt-1 size-5 shrink-0 text-accent" aria-hidden="true" /><div><p className="font-medium text-navy">Office hours</p><p className="text-muted-foreground">{hours}</p></div></div>}
            {!address && phones.length === 0 && !email && <p className="text-muted-foreground">Contact details will be added soon. In the meantime, send us a message.</p>}
          </div>
          <div className="rounded-3xl border border-border bg-white p-6 shadow-sm md:p-8"><h2 className="mb-5 text-2xl text-navy">Send a message</h2><EnquiryForm /></div>
        </div>
      </Section>
    </>
  );
}
