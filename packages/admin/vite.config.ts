import { builtinModules } from "node:module";
import { resolve } from "path";

import { defineConfig } from "vite";
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
  build: {
    minify: false,
    sourcemap: true,
    target: "node22",
    ssr: true,
    rollupOptions: {
      input: resolve(__dirname, "src/cli.ts"),
      output: {
        entryFileNames: "index.mjs",
        format: "es",
      },
      treeshake: true,
      external: [
        "@alcyone-labs/arg-parser",
        "jazz-tools",
        "zod",
        "dotenv",
        "ulidx",
        "@regarde-dev/core",
        "@regarde-dev/jazz-schemas/regarde.bio", // TODO: quick fix, need to
        ...builtinModules,
      ],
    },
  },
});
