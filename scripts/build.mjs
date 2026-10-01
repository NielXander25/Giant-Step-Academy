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
  run("npx prisma migrate deploy");
}

run("npx next build");
