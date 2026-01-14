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
        "src/app/**",
        "src/lib/providers/**",
        "src/lib/styles.ts",
        "src/lib/types.ts",
        "src/db/index.ts",
        "src/db/migrate.ts",
        "src/db/schema.ts",
        "src/components/article-card.tsx",
        "src/components/article-swiper.tsx",
        "src/components/music-player.tsx",
        "src/components/chat-widget.tsx",
        "src/components/footer.tsx",
        "src/components/navbar.tsx",
        "src/components/navbar-ui.tsx",
        "src/components/news-card-widget.tsx",
        "src/components/news-grid.tsx",
        "src/components/pagination.tsx",
      ],
      // @ts-expect-error - 'all' is valid at runtime but missing from types in this version
      all: true,
      include: ["src"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
