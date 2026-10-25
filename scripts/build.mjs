// Build script used by Vercel ("npm run build").
// 1. Generates the Prisma client
// 2. Applies any new database migrations to Neon (production only)
// 3. Builds the Next.js app
import { execSync } from "node:child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

run("npx prisma generate");

const onVercel = Boolean(process.env.VERCEL);
const isPreview = process.env.VERCEL_ENV === "preview";

if (isPreview && process.env.ALLOW_PREVIEW_MIGRATIONS !== "true") {
  console.log("Preview build: skipping database migrations (set ALLOW_PREVIEW_MIGRATIONS=true to enable).");
} else if (!process.env.DIRECT_URL) {
  if (onVercel) {
    console.error("DIRECT_URL is not set. Add your Neon direct connection string in Vercel > Settings > Environment Variables.");
    process.exit(1);
  }
  console.log("DIRECT_URL not set: skipping database migrations.");
} else {
  // Migrations take a database lock that must not go through Neon's connection pooler: through the pooler the lock
  // can be left behind on a pooled connection and every later build then times out (error P1002). If DIRECT_URL was
  // given the pooled address by mistake, use the direct one (the same address without "-pooler").
  const url = new URL(process.env.DIRECT_URL);
  if (url.hostname.includes("-pooler.")) {
    url.hostname = url.hostname.replace("-pooler.", ".");
    url.searchParams.delete("pgbouncer");
    process.env.DIRECT_URL = url.toString();
    console.warn("DIRECT_URL points at the connection pooler; using the direct address for migrations. Set DIRECT_URL to the direct (non-pooler) connection string in Vercel.");
  }
  run("npx prisma migrate deploy");
}

run("npx next build");
