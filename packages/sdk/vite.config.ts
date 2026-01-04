import { defineConfig } from "vite";
import { resolve } from "path";

import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      include: ["src/**/*"],
      exclude: ["**/*.test.ts", "**/*.spec.ts"],
      outDir: "dist",
      entryRoot: "src",
      tsconfigPath: "./tsconfig.json",
    }),
  ],
  resolve: {
    alias: {
      "#schemas": resolve(__dirname, "src/core/schemas"),
      "#managers": resolve(__dirname, "src/core/managers"),
      "#init": resolve(__dirname, "src/core/init"),
      "#core": resolve(__dirname, "src/core"),
      "#frameworks": resolve(__dirname, "src/frameworks"),
    },
  },
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        react: resolve(__dirname, "src/frameworks/react/index.ts"),
        preact: resolve(__dirname, "src/frameworks/preact/index.ts"),
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      treeshake: true,
      external: ["react", "preact", "jazz-tools", "zod"],
    },
  },
});
