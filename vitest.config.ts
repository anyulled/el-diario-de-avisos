import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData",
        "src/lib/providers/**",
        "src/lib/styles.ts",
        "src/lib/types.ts",
        "src/db/**",
        "scripts/test_date_parser.sql",
        "**/*.ico",
        "**/*.png",
        "**/*.svg",
        "**/*.css",
        "src/actions/actions.ts",
        "src/app/**/layout.tsx",
        "src/app/**/loading.tsx",
        "src/app/**/error.tsx",
        "src/app/**/not-found.tsx",
        "src/app/**/apple-icon.png",
        "src/app/**/favicon.ico",
        "src/app/**/icon.png",
        "src/app/**/opengraph-image.tsx",
        "**/*.sql",
        "**/*.jpg",
        "**/*.jpeg",
        "src/app/fonts/**",
      ],
      // @ts-expect-error - 'all' is valid at runtime but missing from types in this version
      all: false,
      include: ["scripts/update-essay.ts", "src/db/schema.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
