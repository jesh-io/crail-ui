/* Bundle the MCP worker into site/_worker.js so the Pages deployment serves
   crail.jesh.dev/mcp itself (static showcase falls through via ASSETS). */
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [path.join(here, "../worker/index.ts")],
  bundle: true,
  format: "esm",
  outfile: path.join(here, "../../site/_worker.js"),
  loader: { ".html": "text" },
  conditions: ["workerd", "worker", "browser"],
  minify: true,
  logLevel: "info",
});
