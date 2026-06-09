import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["assets/js/**/*.js"],
      exclude: ["assets/js/**/*.test.js", "assets/js/**/*.spec.js"],
    },
  },
});
