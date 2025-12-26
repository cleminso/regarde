import { defineConfig } from "vite";
import { resolve } from "path";
import { builtinModules } from "node:module";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
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
        "@hono/node-server",
        "@hono/swagger-ui",
        "@hono/zod-openapi",
        "hono",
        "jazz-tools",
        "zod",
        "dotenv",
        "@regarde-dev/sdk",
        ...builtinModules,
      ],
    },
  },
});
