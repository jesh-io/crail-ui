/* End-to-end smoke test over real stdio: the same protocol a host speaks. */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
let failures = 0;

function check(label, cond, detail = "") {
  console.log(`${cond ? "ok " : "FAIL"} ${label}${cond || !detail ? "" : ` — ${detail}`}`);
  if (!cond) failures++;
}

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [path.join(here, "../dist/server.js")],
});
const client = new Client({ name: "smoke", version: "0.0.0" });
await client.connect(transport);

// tools advertise UI via _meta
const { tools } = await client.listTools();
const render = tools.find((t) => t.name === "render_ui");
check("render_ui listed", !!render);
check(
  "render_ui declares ui resource in _meta",
  render?._meta?.ui?.resourceUri === "ui://crail/playground" ||
    render?._meta?.["ui/resourceUri"] === "ui://crail/playground",
  JSON.stringify(render?._meta),
);
check("list_components listed", tools.some((t) => t.name === "list_components"));
check("get_component listed", tools.some((t) => t.name === "get_component"));

// the app resource serves single-file HTML with the MCP Apps profile
const resource = await client.readResource({ uri: "ui://crail/playground" });
const contents = resource.contents?.[0];
check("playground resource reads", !!contents?.text);
check("mcp-app mime profile", String(contents?.mimeType).includes("mcp-app"), contents?.mimeType);
check("app is single-file (no external src)", !/src="https?:/.test(contents?.text ?? ""));
check("app bundles the kit (crail token present)", (contents?.text ?? "").includes("--crail"));

// expression form renders
const good = await client.callTool({
  name: "render_ui",
  arguments: {
    source: '<StatRow><StatCard label="Spent" value="$4,286" delta="8% vs May" direction="down" /><StatCard label="Saved" value="$5,414" /></StatRow>',
    title: "June spending",
  },
});
check("expression source accepted", !good.isError, JSON.stringify(good.content));
check("structuredContent carries the render", good.structuredContent?.view === "render");

// body form (hooks) renders
const body = await client.callTool({
  name: "render_ui",
  arguments: {
    source:
      'function App() { const [n, setN] = useState(0); return <Button onClick={() => { setN(n + 1); report("clicked", n + 1); }}>Clicked {n}x</Button>; }',
  },
});
check("App-body source accepted", !body.isError, JSON.stringify(body.content));

// broken JSX comes back as a fixable compile error
const broken = await client.callTool({
  name: "render_ui",
  arguments: { source: "<StatCard label=" },
});
check("broken JSX rejected", broken.isError === true);

// unknown component gets a did-you-mean
const unknown = await client.callTool({
  name: "render_ui",
  arguments: { source: '<StatCardd label="x" value="1" />' },
});
const unknownText = unknown.content?.[0]?.text ?? "";
check("unknown component rejected with suggestion", unknown.isError === true && unknownText.includes("StatCard"), unknownText);

// data must not be trusted as compile input — statements without App rejected helpfully
const noApp = await client.callTool({
  name: "render_ui",
  arguments: { source: 'const x = 1;\nconst y = <Badge tone="neutral">hi</Badge>;' },
});
check("statements without App rejected helpfully", noApp.isError === true && (noApp.content?.[0]?.text ?? "").includes("App"));

// catalog tools answer
const list = await client.callTool({ name: "list_components", arguments: {} });
check("list_components returns groups", (list.content?.[0]?.text ?? "").includes("StatCard"));
const sig = await client.callTool({ name: "get_component", arguments: { name: "BarChart" } });
check("get_component returns signature", (sig.content?.[0]?.text ?? "").includes("label: string"), sig.content?.[0]?.text?.slice(0, 120));

await client.close();
console.log(failures === 0 ? "\nAll smoke checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
