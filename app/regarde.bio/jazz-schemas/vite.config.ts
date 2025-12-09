import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    dts({
      include: ["src/**/*"],
      exclude: ["**/*.test.ts", "**/*.spec.ts"],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "regarde.bio/index": resolve(__dirname, "src/regarde.bio/index.ts"),
      },
      name: "jazz-schemas",
      fileName: (format, entryName) => {
        if (entryName === "index") {
          return `jazz-schemas.${format}.js`;
        }
        return `${entryName}.${format}.js`;
      },
      formats: ["es", "cjs"],
    },
    sourcemap: true,
    rollupOptions: {
      external: ["jazz-tools"],
      output: {
        globals: {
          "jazz-tools": "JazzTools",
        },
      },
    },
  },
});
