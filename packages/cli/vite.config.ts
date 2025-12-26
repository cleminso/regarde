import { defineConfig } from "vite";
import { resolve } from "path";
import { builtinModules } from "node:module";
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
      input: resolve(__dirname, "src/index.ts"),
      output: {
        entryFileNames: "index.mjs",
        format: "es",
      },
      treeshake: true,
      external: [
        "chalk",
        "inquirer",
        "@alcyone-labs/arg-parser",
        "jazz-tools",
        "zod",
        "@scure/base",
        "@noble/hashes",
        "node-fetch",
        "dotenv",
        "cojson-transport-ws",
        "@regarde-dev/sdk",
        ...builtinModules,
      ],
    },
  },
});
