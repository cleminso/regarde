import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-utils/setup.ts"],
    testTimeout: 10000,
    hookTimeout: 10000,
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/**"],
  },
});
