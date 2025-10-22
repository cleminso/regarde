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
      },
      formats: ["es", "cjs"],
    },
    sourcemap: true,
    rollupOptions: {
      treeshake: true,
      external: ["react", "preact"],
      output: {
        globals: {
          react: "React",
          preact: "Preact",
        },
      },
    },
  },
});
