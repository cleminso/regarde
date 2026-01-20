import { defineConfig } from "vite";
import { resolve } from "path";

import dts from "vite-plugin-dts";

export default defineConfig({
  mode: process.env.NODE_ENV === "production" ? "production" : "test",
  plugins: [
    dts({
      include: ["src/**/*"],
      exclude: ["**/*.test.ts", "**/*.spec.ts"],
      outDir: "dist",
      entryRoot: "src",
      tsconfigPath: "./tsconfig.json",
      rollupTypes: true,
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
    minify: process.env.NODE_ENV === "production",
    sourcemap: process.env.NODE_ENV !== "production",
    target: "es2020",
    ssr: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "src/index.ts"),
        react: resolve(__dirname, "src/frameworks/react/index.ts"),
        preact: resolve(__dirname, "src/frameworks/preact/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        format: "es",
      },
      treeshake: true,
      external: [
        "react",
        "preact",
        "jazz-tools",
        "jazz-tools/react",
        "zod",
        "dotenv",
        "dotenv/config",
      ],
    },
  },
});
