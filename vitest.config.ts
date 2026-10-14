import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["supabase/functions/**/*.test.ts"],
    // Typecheck against the vitest tsconfig only — never pull Deno edge
    // entrypoints into the Vite/app tsc graph.
    typecheck: {
      tsconfig: "./tsconfig.vitest.json",
    },
  },
});
