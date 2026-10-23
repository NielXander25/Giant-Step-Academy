import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Lets tests load .tsx files (such as the PDF layout).
  oxc: { jsx: { runtime: "automatic" } },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
