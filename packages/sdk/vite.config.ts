import { defineConfig } from "vite";
import { resolve } from "path";

import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      include: ["src/**/*"],
      exclude: ["**/*.test.ts", "**/*.spec.ts"],
    }),
  ],
  build: {
    lib: {
      entry: {
        react: resolve(__dirname, "src/react/index.ts"),
        preact: resolve(__dirname, "src/preact/index.ts"),
        auth: resolve(__dirname, "src/auth/index.ts"),
        verify: resolve(__dirname, "src/verify/index.ts"),
        regardeUsers: resolve(__dirname, "src/regardeUsers/index.ts"),
      },
      formats: ["es", "cjs"],
    },
    sourcemap: true,
    rollupOptions: {
      treeshake: true,
      external: ["react", "preact", "jazz-tools"],
      output: {
        globals: {
          react: "React",
          preact: "Preact",
          "jazz-tools": "JazzTools",
        },
      },
    },
  },
});
