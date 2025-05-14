/// <reference types="vite/client" />

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
  build: {
    lib: {
      entry: {
        index: "./src/index.ts",
        types: "./src/index.ts",
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        if (entryName === "types") {
          return `index.d.${format === "es" ? "ts" : "cts"}`;
        }
        return `index.${format === "es" ? "js" : "cjs"}`;
      },
    },
    rollupOptions: {
      external: ["react", "react-dom", "jazz"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    outDir: "dist",
  },
});
