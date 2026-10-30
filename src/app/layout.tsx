import type { Metadata, Viewport } from "next";
import { Nunito, Playfair_Display } from "next/font/google";
import { siteUrl } from "@/lib/site-url";
import { isDemoSite } from "@/lib/demo/mode";
import "./globals.css";

const display = Playfair_Display({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });
const body = Nunito({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Giant Step Academy", template: "%s | Giant Step Academy" },
  description: "Giant Step Academy: Nursery, Primary and Secondary school in Sabon Tasha, Kaduna.",
  openGraph: { type: "website", siteName: "Giant Step Academy", locale: "en_NG" },
};

export const viewport: Viewport = {
  themeColor: "#142a4c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {isDemoSite() && (
          <div className="bg-amber-400 px-4 py-1 text-center text-xs font-semibold text-black print:hidden">DEMO SITE · practice data only · nothing here is a real student or result</div>
        )}
        {children}
      </body>
    </html>
  );
}
