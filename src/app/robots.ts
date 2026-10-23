import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/teacher", "/super-admin", "/account", "/results", "/api", "/login", "/register-teacher", "/setup", "/dashboard"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
