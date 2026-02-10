import { resolve } from "path";

import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    devtools(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "#ui": resolve(import.meta.dirname, "./src/components/ui"),
      "#": resolve(import.meta.dirname, "./src"),
    },
  },
  server: { port: 3001, host: true },
  build: { outDir: "dist", sourcemap: true, target: "es2022" },
});
