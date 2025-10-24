import { defineConfig } from "vite";

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
      entry: "src/index.ts",
      name: "jazz-schemas",
      fileName: (format) => `jazz-schemas.${format}.js`,
      formats: ["es", "cjs"],
    },
    sourcemap: true,
    rollupOptions: {
      external: ["jazz-tools"],
      output: {
        globals: {
          "jazz-tools": "JazzTools",
        },
      },
    },
  },
});
