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
      "#": resolve(import.meta.dirname, "./src/components"),
      "@": resolve(import.meta.dirname, "./src"),
      "#auth": resolve(import.meta.dirname, "./src/components/auth"),
      "#atoms": resolve(import.meta.dirname, "./src/atoms"),
      "#layout": resolve(import.meta.dirname, "./src/components/layout"),
      "#navigation": resolve(import.meta.dirname, "./src/components/navigation"),
      "#overview": resolve(import.meta.dirname, "./src/components/overview"),
      "#register-app": resolve(import.meta.dirname, "./src/components/register-app"),
      "#settings": resolve(import.meta.dirname, "./src/components/settings"),
      "#webhooks": resolve(import.meta.dirname, "./src/components/webhooks"),
      "#lib": resolve(import.meta.dirname, "./src/lib"),
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
