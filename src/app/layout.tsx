import type { Metadata, Viewport } from "next";
import { Figtree, Newsreader } from "next/font/google";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const display = Newsreader({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Giant Step Academy", template: "%s | Giant Step Academy" },
  description: "Giant Step Academy: Nursery, Primary and Secondary school in Sabon Tasha, Kaduna.",
  openGraph: { type: "website", siteName: "Giant Step Academy", locale: "en_NG" },
};

export const viewport: Viewport = {
  themeColor: "#12408f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
