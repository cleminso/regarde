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
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: {
        react: resolve(__dirname, "src/react/index.ts"),
        preact: resolve(__dirname, "src/preact/index.ts"),
        auth: resolve(__dirname, "src/auth/index.ts"),
        verify: resolve(__dirname, "src/verify-token/index.ts"),
        "regarde-users": resolve(__dirname, "src/regarde-users/index.ts"),
        registry: resolve(__dirname, "src/registry/index.ts"),
        payments: resolve(__dirname, "src/payments/index.ts"),
        init: resolve(__dirname, "src/init/index.ts"),
        app: resolve(__dirname, "src/app/index.ts"),
      },
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      treeshake: true,
      external: ["react", "preact", "jazz-tools", "zod"],
    },
  },
});
