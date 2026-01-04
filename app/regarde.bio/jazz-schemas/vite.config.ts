import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

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
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "regarde.bio/index": resolve(__dirname, "src/regarde.bio/index.ts"),
      },
      fileName: (format, entryName) => {
        if (entryName === "index") {
          return `jazz-schemas.${format}.js`;
        }
        return `${entryName}.${format}.js`;
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      treeshake: true,
      external: [
        "jazz-tools",
        "@regarde-dev/core",
        "zod",
        "ulidx",
        "@hono/zod-openapi",
      ],
    },
  },
});
