import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["@node-rs/argon2", "exceljs", "@react-pdf/renderer"],
  // The PDF library loads its built-in fonts (Helvetica, Times) by a file name it works out at run time, so the
  // build cannot see them and leaves them out of the deployed PDF routes. Ship them explicitly.
  outputFileTracingIncludes: {
    "/api/results/pdf": ["./node_modules/pdfkit/js/standard-fonts/**"],
    "/api/results/sample-pdf": ["./node_modules/pdfkit/js/standard-fonts/**"],
    "/api/pins/pdf": ["./node_modules/pdfkit/js/standard-fonts/**"],
  },
  // The menu was cut to five pages; the old addresses lead to where their content now lives.
  async redirects() {
    return [
      { source: "/academics", destination: "/events#classes", permanent: false },
      { source: "/school-life", destination: "/events", permanent: false },
      { source: "/gallery", destination: "/events#gallery", permanent: false },
      { source: "/staff", destination: "/about#staff", permanent: false },
      { source: "/contact", destination: "/admissions#enquire", permanent: false },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Result pages and downloads must never be stored by a browser or a shared cache.
      { source: "/results/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/api/results/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
