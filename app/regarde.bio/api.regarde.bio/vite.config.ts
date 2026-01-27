import { builtinModules } from "node:module";
import { resolve } from "path";

import { defineConfig } from "vite";

export default defineConfig({
  plugins: [],
  build: {
    minify: false,
    sourcemap: true,
    target: "node22",
    ssr: true,
    rollupOptions: {
      input: resolve(__dirname, "src/index.ts"),
      output: {
        entryFileNames: "index.js",
        format: "es",
      },
      treeshake: true,
      external: [
        "hono",
        "@hono/node-server",
        "@hono/swagger-ui",
        "@hono/zod-openapi",
        "jazz-tools",
        "zod",
        "dotenv",
        "@regarde-dev/jazz-schemas",
        "@regarde-dev/core",
        ...builtinModules,
      ],
    },
  },
});
