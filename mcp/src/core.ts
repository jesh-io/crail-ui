/* crail-mcp core — transport-agnostic server assembly.
   Entry points (stdio bin, Cloudflare Worker) inject the app HTML and
   catalog; everything protocol-level lives here on the official SDKs. */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { transform } from "sucrase";

export const APP_URI = "ui://crail/playground";

export type CatalogEntry = {
  name: string;
  group: string;
  groupLabel: string;
  kind: "component" | "value";
  signature: string;
};
export type Catalog = { entries: CatalogEntry[] };

/* ---- the compile gate: fail fast with errors the model can fix ---- */
function compileCheck(source: string): { ok: true } | { ok: false; error: string } {
  let expressionError: string;
  try {
    transform(`const __ui = (\n${source}\n);`, { transforms: ["jsx", "typescript"] });
    return { ok: true };
  } catch (err) {
    expressionError = err instanceof Error ? err.message : String(err);
  }
  try {
    transform(source, { transforms: ["jsx", "typescript", "imports"] });
    if (!/\b(?:function|const|let|class)\s+App\b/.test(source)) {
      return {
        ok: false,
        error:
          "Source has statements but never defines `App`. Either write a single JSX expression, " +
          "or define `function App() { ... }` as the root component.",
      };
    }
    return { ok: true };
  } catch (err) {
    const bodyError = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: `JSX did not parse.\nAs expression: ${expressionError}\nAs component body: ${bodyError}`,
    };
  }
}

function levenshteinLte(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = [...Array(b.length + 1).keys()];
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length] <= max;
}

function componentIndex(catalog: Catalog): string {
  const byGroup = new Map<string, string[]>();
  for (const e of catalog.entries) {
    if (!byGroup.has(e.groupLabel)) byGroup.set(e.groupLabel, []);
    byGroup.get(e.groupLabel)!.push(e.name);
  }
  return [...byGroup.entries()].map(([label, names]) => `${label}: ${names.join(", ")}`).join("\n");
}

function renderDescription(catalog: Catalog): string {
  return `Render a live, interactive UI widget in the conversation by composing crail-ui components — Claude's own design language (warm paper, terracotta accent, automatic light/dark theme). The widget looks native to the Claude interface, not embedded. PREFER this over prose whenever the user will scan, compare, or act on something: data, results, progress, choices, confirmations, forms. Micro-widgets are cheap — a lone StatRow or a confirm Button beats a paragraph.

CONTRACT for \`source\` (JSX, no imports — everything below is already in scope):
- Either ONE JSX expression: <StatRow><StatCard label="Spent" value="$4,286" delta="12%" direction="down" /></StatRow>
- Or statements defining \`App\` for stateful widgets: function App() { const [tab, setTab] = useState("overview"); return ...; }
- In scope: every component listed below, React, useState/useEffect/useMemo/useRef/useCallback/useReducer, \`data\` (your JSON payload from the \`data\` argument — pass real data there, don't inline large literals), \`report(event, detail?)\`, \`useDisplayMode()\`, \`requestDisplayMode("fullscreen"|"inline")\`.
- Call report("what happened", detail) in every event handler — user interactions flow back to you silently so you can respond to what they clicked, chose, or typed.
- Widgets can escalate themselves: an expand affordance calling requestDisplayMode("fullscreen"), with useDisplayMode() to render a compact inline card vs. a full-page layout (wrap the fullscreen branch in a min-height:100dvh container). Build micro-experiences inline; build full apps in fullscreen.
- Never hardcode colors or fonts — the kit is themed by the host. For spacing/arrangement prefer <Stack gap>, <Grid cols|min>, <Cluster> over hand-written style props; fall back to style only for what they can't express.

AVAILABLE COMPONENTS (call list_components once for full prop signatures; get_component for a quick single lookup):
${componentIndex(catalog)}

RECIPES:
- Dashboard: <Stack><StatRow>…</StatRow><BarChart data={data.byMonth} /><DataTable columns={…} rows={data.rows} /></Stack>
- Fullscreen app shell: <Stack gap={16} style={{minHeight:"100dvh"}}><PageHeader title="…" sub="…" actions={…} onBack={() => requestDisplayMode("inline")} />…content…</Stack>
- Confirm flow: App with useState; Button onClick={() => { setDone(true); report("user confirmed", {id: data.id}); }} → swap in a StatusBanner tone="success".
- Drill-in: inline shows headline stats + an expand IconButton → fullscreen shows the browsing surface.
- Browse-and-inspect (fullscreen): <MasterDetail master={<ListManager>…rows with onClick…</ListManager>} detail={sel ? <KeyValue rows={…} /> : null} onClose={() => setSel(null)} height="100dvh" /> — selection-aware list+detail with a resizable divider (variant="overlay" for an inspector panel over the list; side="right" to flip). Narrow widths handle themselves: split becomes stacked pages with a back header, overlay becomes a bottom card.

If this tool returns an error, it is always fixable from the message (parse position, unknown-component suggestions) — correct the source and call again.`;
}

export function createCrailServer(appHtml: string, catalog: Catalog): McpServer {
  const catalogNames = new Set(catalog.entries.map((e) => e.name));

  const unknownComponents = (source: string): string[] => {
    const localDefs = new Set(
      [...source.matchAll(/\b(?:function|const|let|class)\s+([A-Z]\w*)/g)].map((m) => m[1]),
    );
    const used = new Set([...source.matchAll(/<([A-Z]\w*)/g)].map((m) => m[1]));
    return [...used].filter((n) => !catalogNames.has(n) && !localDefs.has(n) && n !== "App");
  };

  const suggest = (name: string): string[] => {
    const lower = name.toLowerCase();
    return [...catalogNames]
      .filter((c) => {
        const cl = c.toLowerCase();
        return cl.includes(lower) || lower.includes(cl) || levenshteinLte(cl, lower, 2);
      })
      .slice(0, 4);
  };

  const server = new McpServer(
    { name: "crail", version: "0.1.0" },
    {
      instructions: `Crail gives you a live UI surface in this conversation: render_ui turns JSX you write into a real, interactive widget in Claude's own design language. It renders native to the interface — use it as your visual voice, not as an embed.

USE IT PROACTIVELY. Any time you are about to present data, results, progress, options, comparisons, or ask for a decision, render a widget instead of (or alongside) prose. Range: a single StatRow micro-widget up to a fullscreen multi-tab app — match the moment.

WORKFLOW (keep round-trips minimal):
1. The render_ui description already lists every component. For prop details, call list_components ONCE per conversation — it returns the complete API with full signatures. Don't re-call it; don't call get_component for components you've already seen.
2. Compose and call render_ui. For most widgets this is the only call.
3. Compile errors come back as precise, fixable messages (parse position, did-you-mean suggestions) — fix and re-call.

THE FEEDBACK LOOP: widgets talk back. console output, render errors, and every report(event, detail) call inside your handlers arrive to you silently as "Playground feedback". Wire report() into every interactive element, then act on what the user did — update the widget with another render_ui, run tools, or answer. This makes widgets a two-way channel, not a static picture.

INTERACTIVITY: define function App() { ... } with hooks (useState etc.) for stateful widgets — tabs, forms, confirm flows, drill-ins. Widgets can request fullscreen themselves via requestDisplayMode("fullscreen") and adapt layout with useDisplayMode(). Design inline widgets as compact cards; design fullscreen as a full page (min-height 100dvh container).

DATA: pass the real payload through the data argument and reference it as \`data\` in JSX — don't inline big literals into the source string.`,
    },
  );

  registerAppResource(server, "Crail Playground", APP_URI, {}, async () => ({
    contents: [{ uri: APP_URI, mimeType: RESOURCE_MIME_TYPE, text: appHtml }],
  }));

  registerAppTool(
    server,
    "render_ui",
    {
      title: "Render UI",
      description: renderDescription(catalog),
      inputSchema: {
        source: z.string().describe("JSX: one expression, or statements defining App"),
        data: z
          .unknown()
          .optional()
          .describe("JSON payload available in the snippet as `data`"),
        title: z.string().optional().describe("Short label for what this widget shows"),
      },
      _meta: { ui: { resourceUri: APP_URI }, "ui/resourceUri": APP_URI },
    },
    async ({ source, data, title }) => {
      const check = compileCheck(source);
      if (!check.ok) {
        return { isError: true, content: [{ type: "text", text: `Compile error: ${check.error}` }] };
      }
      const unknown = unknownComponents(source);
      if (unknown.length > 0) {
        const hints = unknown
          .map((n) => {
            const s = suggest(n);
            return s.length
              ? `<${n}> is not a crail-ui component — did you mean ${s.join(", ")}?`
              : `<${n}> is not a crail-ui component.`;
          })
          .join("\n");
        return { isError: true, content: [{ type: "text", text: `Unknown components:\n${hints}` }] };
      }
      const components = [...new Set([...source.matchAll(/<([A-Z]\w*)/g)].map((m) => m[1]))];
      return {
        content: [
          {
            type: "text",
            text: `Rendered${title ? ` "${title}"` : ""} using: ${components.join(", ")}. The widget is live above; user interactions and console output will arrive as playground feedback.`,
          },
        ],
        structuredContent: { view: "render", source, data, title },
      };
    },
  );

  server.registerTool(
    "list_components",
    {
      title: "List Crail components",
      description:
        "The complete crail-ui API in one call: every component available to render_ui, grouped, with full TypeScript prop signatures. Call ONCE per conversation, then compose from memory — no per-component lookups needed.",
      inputSchema: {
        group: z
          .enum(["primitives", "widgets", "layout", "chat", "icons"])
          .optional()
          .describe("Only list one group (default: everything)"),
      },
    },
    async ({ group }) => {
      const entries = catalog.entries.filter((e) => !group || e.group === group);
      const byGroup = new Map<string, CatalogEntry[]>();
      for (const e of entries) {
        if (!byGroup.has(e.groupLabel)) byGroup.set(e.groupLabel, []);
        byGroup.get(e.groupLabel)!.push(e);
      }
      const text = [...byGroup.entries()]
        .map(([label, list]) => `## ${label}\n\n${list.map((e) => e.signature).join("\n\n")}`)
        .join("\n\n");
      return {
        content: [
          {
            type: "text",
            text: `${text}\n\nThis is the full API — compose with render_ui; everything above is already in scope there (plus data, report, useDisplayMode, requestDisplayMode).`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_component",
    {
      title: "Get component signature",
      description:
        "Full TypeScript prop signature for one or more crail-ui components (comma-separated). Only for a quick spot-check — prefer one list_components call for the whole API.",
      inputSchema: {
        name: z.string().describe('Component name(s), e.g. "StatCard" or "BarChart, DataTable"'),
      },
    },
    async ({ name }) => {
      const wanted = name.split(",").map((n) => n.trim()).filter(Boolean);
      const parts = wanted.map((n) => {
        const entry = catalog.entries.find((e) => e.name === n);
        if (!entry) {
          const s = suggest(n);
          return `${n}: not found.${s.length ? ` Did you mean ${s.join(", ")}?` : ""}`;
        }
        return entry.signature;
      });
      return { content: [{ type: "text", text: parts.join("\n\n") }] };
    },
  );

  return server;
}
