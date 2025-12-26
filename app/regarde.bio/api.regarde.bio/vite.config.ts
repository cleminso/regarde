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
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
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
        "@regarde-dev/sdk",
        ...builtinModules,
      ],
    },
  },
});
