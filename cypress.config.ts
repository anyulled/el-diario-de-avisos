import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "v46d9k",
  e2e: {
    baseUrl: "http://localhost:3000",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,
    screenshotOnRunFailure: true,
    setupNodeEvents(_config) {
      // Implement node event listeners here
    },
  },
});
