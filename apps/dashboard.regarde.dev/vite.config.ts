import { resolve } from "path";
import { agentTail } from "agent-tail/vite";

import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Explicitly use PORT from portless
const PORT = parseInt(process.env.PORT || "5173");

export default defineConfig({
  plugins: [
    devtools(),
    agentTail(),
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
  server: { port: PORT, host: true },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2022",
    rolldownOptions: {
      experimental: {
        // lazyBarrel: true,
      },
    },
  },
});
