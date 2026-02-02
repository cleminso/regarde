import path from "path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [viteTsConfigPaths(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  appType: "spa",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
            return "vendor-react";
          }
          if (id.includes("@radix-ui")) {
            return "vendor-ui";
          }
          if (id.includes("@clerk")) {
            return "vendor-clerk";
          }
          if (id.includes("jazz-tools")) {
            return "vendor-jazz";
          }
          if (
            id.includes("clsx") ||
            id.includes("tailwind-merge") ||
            id.includes("class-variance-authority") ||
            id.includes("lucide-react")
          ) {
            return "vendor-utils";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
