# Crail

**An MCP tool UI kit in Claude's design language.**

Most MCP tools bolt a foreign interface onto a conversation. Crail takes the
opposite view: match the host's design language — warm paper, a serif voice,
one terracotta accent — so a tool result reads as part of the reply, not an ad
inside it.

Named for the terracotta (`#D97757`) Claude is known by.

**Showcase & docs → [crail.jesh.dev](https://crail.jesh.dev)** — every
component with variants, plus fully rendered chat scenarios. Flip on
*Inspect components* in a scenario to see every kit component outlined and
named in place.

## Install

```sh
npm install crail-ui
```

React 18+ and a bundler that handles CSS imports (Vite, Next.js, etc.) are
assumed.

```tsx
import { ToolCallBlock, StatCard, StatRow, ConfirmationCard } from "crail-ui";
import "crail-ui/fonts.css"; // optional — self-hosted fonts via Fontsource

function SpendingResult() {
  return (
    <ToolCallBlock
      tool="get_spending_totals"
      server="copilot-money"
      status="success"
      duration="0.4s"
      params={{ period: "2026-06" }}
    >
      <StatRow>
        <StatCard label="Total spent" value="$4,286" delta="8% vs May" direction="down" />
        <StatCard label="Saved" value="$5,414" delta="+$610" direction="up" />
      </StatRow>
    </ToolCallBlock>
  );
}
```

Importing from `crail-ui` pulls in the design tokens and component styles
automatically. Dark mode is one attribute: set `data-theme="dark"` on any
ancestor (usually `<html>`).

## What's inside

- **Tokens** — the full design system as CSS custom properties, light and
  dark. Components never hardcode a color; retheme everything by overriding
  tokens.
- **Primitives** — Button, Badge, Chip, Avatar, Card, Input, Select,
  Checkbox, Radio, Switch, Slider, Tabs, Segmented, Tooltip, Kbd, Spinner,
  ProgressBar, Skeleton, KeyValue, Menu, Modal, Toast, EmptyState.
- **Chat chrome** — ChatFrame, UserMessage, AssistantMessage, ThinkingBlock,
  ContextDivider, ToolCallBlock, CodeBlock, ChatInput, SuggestionChips.
- **Layout** — Disclosure, Accordion, CollapsibleCard, SplitView (draggable,
  keyboard-nudgeable divider), Sheet (side/bottom, portal + scrim + Escape),
  Fullscreen takeover, and Expandable — wrap any widget to give it an
  open-full-screen affordance.
- **Tool widgets** — StatCard, BarChart, LineChart, DonutChart, DataTable,
  ListManager, FileCard, MediaCard, StatusBanner, ConfirmationCard,
  ElicitationCard, ProgressTracker, TaskChecklist, LogViewer, DiffView,
  Timeline, EntityCard.

## Building an MCP App with Crail

Crail is host-agnostic React, but it was designed for exactly one job:
rendering MCP tool results inline in Claude (and any other
[MCP Apps](https://github.com/modelcontextprotocol/ext-apps)-compliant host).
This is the canonical wiring, end to end. Don't hand-roll the protocol —
everything below comes from `@modelcontextprotocol/ext-apps`, the official
SDK, which Claude's own docs point at.

```sh
npm install crail-ui @modelcontextprotocol/ext-apps react react-dom
npm install -D vite @vitejs/plugin-react vite-plugin-singlefile
```

### 1 · One widget, many tools

Build ONE self-contained HTML file and let every tool point at it. The host
caches the resource; your views switch on a discriminator you put in
`structuredContent`:

```ts
// payload.ts — the contract your server and widget share
export type WidgetPayload =
  | { view: "summary"; totalSpent: number; totalIncome: number }
  | { view: "transactions"; transactions: Transaction[] }
  | { view: "error"; message: string };
```

### 2 · The widget

Use the official React hooks — `useApp` handles the transport + handshake,
`useHostStyles` applies the host's theme, CSS variables, and fonts. The
theme lands as `data-theme` on the document root, which is Crail's native
theming contract — **dark mode works with zero extra code**.

```tsx
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import "crail-ui";            // tokens + component styles
import "crail-ui/fonts.css";  // optional self-hosted fonts

function Widget() {
  const [payload, setPayload] = React.useState<WidgetPayload | null>(null);

  const { app } = useApp({
    appInfo: { name: "my-widget", version: "1.0.0" },
    capabilities: {},
    autoResize: true, // reports height to the host via ResizeObserver
    onAppCreated(app) {
      // Register handlers BEFORE the handshake (onAppCreated runs pre-connect).
      app.ontoolinput = () => setPayload(null); // new call → loading state
      app.ontoolresult = (result) => {
        const p = result.structuredContent as WidgetPayload | undefined;
        if (p?.view) setPayload(p);
        else if (result.isError)
          setPayload({ view: "error", message: "The tool call failed." });
      };
      app.onteardown = async () => ({});
    },
  });

  useHostStyles(app, app?.getHostContext()); // theme → data-theme → Crail tokens

  if (!payload) return <Spinner />;
  switch (payload.view) {
    case "summary":
      return (
        <StatRow>
          <StatCard label="Spent" value={usd(payload.totalSpent)} />
          <StatCard label="Income" value={usd(payload.totalIncome)} />
        </StatRow>
      );
    case "transactions":
      return <DataTable columns={…} rows={…} />;
    case "error":
      return <StatusBanner tone="error" title={payload.message} />;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Widget />);
```

Bundle it into a single file — the host renders it in a sandboxed iframe
with no network access, so everything must be inlined:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { assetsInlineLimit: 100_000_000, cssCodeSplit: false },
});
```

### 3 · The server

Register the built HTML as a `ui://` resource and declare it on each tool
via `_meta.ui.resourceUri`. Keep the text fallback — UI is an enhancement,
not a replacement:

```ts
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";

const WIDGET_URI = "ui://my-server/widget.html";

registerAppResource(server, "My Widget", WIDGET_URI, {}, async () => ({
  contents: [{ uri: WIDGET_URI, mimeType: RESOURCE_MIME_TYPE, text: widgetHtml }],
}));

registerAppTool(
  server,
  "get_summary",
  {
    description: "Spending summary",
    inputSchema: { month: z.string() },
    _meta: { ui: { resourceUri: WIDGET_URI } },
  },
  async ({ month }) => {
    const data = await fetchSummary(month);
    return {
      content: [{ type: "text", text: JSON.stringify(data) }], // text-only hosts
      structuredContent: { view: "summary", ...data },          // what the widget renders
    };
  },
);
```

### 4 · Checklist (the mistakes everyone makes)

- **Text fallback always** — never ship a tool that only renders UI.
- **Handlers before `connect()`** — register them in `onAppCreated`, not after.
- **`vite-plugin-singlefile`** — separate asset files 404 inside the sandbox.
- **Register the resource** — a `resourceUri` with no matching resource renders nothing.
- **Theme through tokens** — never hardcode colors; `data-theme` must restyle everything.
- **`structuredContent` is the widget's input** — treat the text block as a
  serialization of it, not the other way around.

For a full production example — 49 tools sharing one Crail widget, with a
simulated-host test harness driving the real protocol — see
[copilot-mcp](https://github.com/jesh-io/copilot-mcp) (`ui/` + `src/ui/`).

## Design rules the kit encodes

- Warm ivory paper (`#FAF9F5`) and warm ink — never pure gray.
- One terracotta accent per view; status colors stay muted (moss, amber,
  clay red, denim).
- Three type voices: serif for the assistant and display numerals, a quiet
  grotesque for chrome, mono for anything the machine said verbatim.
- Tool results render as widgets, not JSON; the request stays visible
  verbatim inside the tool block.
- Nothing writes without a ConfirmationCard — the diff or key-value detail
  *is* the approval UI.

## Develop

```sh
npm install
npm run dev        # showcase at http://localhost:5183
npm run build:lib  # compile the package to dist/
npm run build      # package + static showcase site
```

The kit lives in `src/kit/`; the showcase storybook in `src/showcase/`.

## License

[MIT](LICENSE)
