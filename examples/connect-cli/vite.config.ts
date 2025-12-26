import { defineConfig } from "vite";
import { resolve } from "path";
import { builtinModules } from "node:module";

export default defineConfig({
  plugins: [],
  build: {
    minify: false,
    sourcemap: true,
    target: "node22",
    lib: {
      entry: resolve(__dirname, "index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      treeshake: true,
      external: ["@regarde-dev/cli", ...builtinModules],
    },
  },
});
