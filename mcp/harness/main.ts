/* A faithful MCP Apps host on the official AppBridge: loads the REAL built
   playground app, delivers a real tool result, and surfaces the app's
   updateModelContext feedback — the loop Claude will live in. */
import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";
// @ts-expect-error vite raw import
import appHtml from "../dist-app/index.html?raw";

const SNIPPET = `function App() {
  const [approved, setApproved] = useState(false);
  return (
    <Card>
      <StatRow>
        <StatCard label="Total spent" value="$4,286" delta="8% vs May" direction="down" />
        <StatCard label="Saved" value="$5,414" delta="+$610" direction="up" />
      </StatRow>
      <BarChart title="June by category" data={data.categories} />
      {approved
        ? <StatusBanner tone="success" title="Budget confirmed" />
        : <Button variant="primary" onClick={() => { setApproved(true); report("user confirmed budget"); }}>Confirm budget</Button>}
    </Card>
  );
}`;

const DATA = {
  categories: [
    { label: "Rent", value: 2200 },
    { label: "Food", value: 840 },
    { label: "Transport", value: 320 },
    { label: "Fun", value: 510 },
    { label: "Other", value: 416 },
  ],
};

window.addEventListener("message", (e) => {
  if (e.data && typeof e.data === "object" && "crailDebug" in e.data) {
    console.error("[app-debug]", (e.data as { crailDebug: string }).crailDebug);
  }
});

const statusEl = document.getElementById("status")!;
const feedbackEl = document.getElementById("feedback")!;
const iframe = document.getElementById("app") as HTMLIFrameElement;

let dark = false;
const notheme = new URLSearchParams(location.search).has("notheme");
const hostContext = () => ({
  ...(notheme ? {} : { theme: dark ? ("dark" as const) : ("light" as const) }),
  displayMode: "inline" as const,
  availableDisplayModes: ["inline" as const],
});

const bridge = new AppBridge(
  null,
  { name: "crail-harness", version: "0.0.0" },
  {},
  { getHostContext: hostContext },
);

bridge.onupdatemodelcontext = async (params) => {
  const text = (params.content ?? [])
    .map((c: { type: string; text?: string }) => (c.type === "text" ? c.text : `[${c.type}]`))
    .join("\n");
  feedbackEl.textContent = `${new Date().toLocaleTimeString()} — ${text}`;
  console.log("[harness] updateModelContext:", text);
  return {};
};

bridge.oninitialized = async () => {
  statusEl.textContent = "app initialized — delivering tool result…";
  await bridge.sendToolInput({ arguments: { source: SNIPPET, data: DATA, title: "June budget" } });
  await bridge.sendToolResult({
    content: [{ type: "text", text: "rendered" }],
    structuredContent: { view: "render", source: SNIPPET, data: DATA, title: "June budget" },
  });
  statusEl.textContent = "tool result delivered — widget should be live below";
};

document.getElementById("theme")!.addEventListener("click", () => {
  dark = !dark;
  document.body.classList.toggle("dark", dark);
  bridge.setHostContext(hostContext()); // setHostContext stores + notifies (ext-apps ≥1.7)
});

const params = new URLSearchParams(location.search);
const nohost = params.has("nohost");
const delay = Number(params.get("delay") ?? 0);
iframe.addEventListener("load", async () => {
  if (nohost) {
    statusEl.textContent = "nohost mode — app loaded, no bridge";
    return;
  }
  if (delay) {
    statusEl.textContent = `waiting ${delay}ms before connecting…`;
    await new Promise((r) => setTimeout(r, delay));
  }
  const transport = new PostMessageTransport(iframe.contentWindow!, iframe.contentWindow!);
  await bridge.connect(transport);
  statusEl.textContent = "transport connected — waiting for app handshake…";
});
/* Blob src (not srcdoc): closer to real hosts, which serve the app from a
   sandboxed origin — and srcdoc+sandbox+postMessage can wedge Chrome's
   compositor into never painting the frame. */
/* KNOWN LOCAL QUIRK: with sandbox="allow-scripts" (opaque origin) + an
   immediate bridge connect, this Chrome never paints the frame even though
   the app runs and lays out correctly (verified by beacons). Real hosts
   (claude.ai) render this stack fine. Pass ?sameorigin=1 for visual dev. */
if (params.has("sameorigin")) iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
const noresize = params.has("noresize");
const html = noresize
  ? appHtml.replace("<head>", "<head><script>window.__CRAIL_NORESIZE=1</script>")
  : appHtml;
iframe.src = URL.createObjectURL(new Blob([html], { type: "text/html" }));
