import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["tests/**/*.test.ts"],
    env: {
      // Exercise all date logic under a non-UTC zone so UTC day shifting
      // would fail the tests.
      TZ: "America/Los_Angeles",
    },
  },
});
