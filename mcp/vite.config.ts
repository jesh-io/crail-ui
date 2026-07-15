import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

/* The playground app builds from the kit's SOURCE (not dist) so app and kit
   never drift; the sandbox blocks all network, so everything inlines. */
export default defineConfig({
  root: path.join(here, "app"),
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      "crail-ui/fonts.css": path.join(here, "../src/kit/fonts.css"),
      "crail-ui": path.join(here, "../src/kit/index.ts"),
    },
  },
  build: {
    outDir: path.join(here, "dist-app"),
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
  },
});
