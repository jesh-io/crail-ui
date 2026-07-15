import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(here, "harness"),
  plugins: [viteSingleFile()],
  build: {
    outDir: path.join(here, "dist-harness"),
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
  },
});
