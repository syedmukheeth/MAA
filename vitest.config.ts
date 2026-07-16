import { defineConfig } from "vitest/config";

export default defineConfig({
  // Vite resolves tsconfig `paths` (the `@/*` alias) natively — no plugin.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
