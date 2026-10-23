import { SiteShell } from "@/components/site/site-shell";

// Pages are built when visited (not at deploy time), and read through the site cache so most visits skip the database.
export const dynamic = "force-dynamic";

// Every public page except the home page (which wraps itself) gets the school header and footer.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
