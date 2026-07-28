import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/tests/setup.ts"],
    pool: "forks",
    singleFork: true,
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});
