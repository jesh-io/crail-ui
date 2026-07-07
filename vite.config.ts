import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "site",
  },
  server: {
    port: 5183,
    strictPort: true,
  },
});
