import type { Metadata, Viewport } from "next";
import { Figtree, Newsreader } from "next/font/google";
import "./globals.css";

const display = Newsreader({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Giant Step Academy", template: "%s | Giant Step Academy" },
  description: "Giant Step Academy — primary and secondary school.",
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
