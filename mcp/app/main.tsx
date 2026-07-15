import * as React from "react";
import ReactDOM from "react-dom/client";

/* Boot beacon: surface fatal errors even when the iframe console is
   unreachable (opaque origin). Harmless in real hosts. */
function beacon(msg: string) {
  try {
    window.parent.postMessage({ crailDebug: msg }, "*");
  } catch {}
}
window.addEventListener("error", (e) =>
  beacon(`window.onerror: ${e.message} @ ${e.filename}:${e.lineno}`),
);
window.addEventListener("unhandledrejection", (e) =>
  beacon(`unhandledrejection: ${String(e.reason)}`),
);
beacon("module loaded");
import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import type { App } from "@modelcontextprotocol/ext-apps";
import { Spinner } from "crail-ui";
import "crail-ui";
import "crail-ui/fonts.css";
import { Boundary, evaluateSnippet, type RenderPayload } from "./runtime";

/* ---- feedback channel: console + report() + render errors flow back to the
   model silently via updateModelContext. The model iterates on what it sees. ---- */
type LogEntry = { kind: "log" | "warn" | "error" | "event" | "render-error"; text: string };

const buffer: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let appRef: App | null = null;

function pushLog(entry: LogEntry) {
  buffer.push(entry);
  if (buffer.length > 80) buffer.splice(0, buffer.length - 80);
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 400);
}

function flush() {
  if (!appRef || buffer.length === 0) return;
  const entries = buffer.splice(0);
  void appRef
    .updateModelContext({
      content: [
        {
          type: "text",
          text:
            "Playground feedback (console/events from the rendered widget):\n" +
            entries.map((e) => `[${e.kind}] ${e.text}`).join("\n"),
        },
      ],
    })
    .catch(() => {});
}

for (const kind of ["log", "warn", "error"] as const) {
  const original = console[kind].bind(console);
  console[kind] = (...args: unknown[]) => {
    original(...args);
    pushLog({ kind, text: args.map(stringify).join(" ") });
  };
}

function stringify(v: unknown): string {
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function report(event: string, detail?: unknown) {
  pushLog({ kind: "event", text: detail === undefined ? event : `${event} ${stringify(detail)}` });
}

/* ---- display-mode store: snippets subscribe via useDisplayMode() without
   re-evaluating (a remount would wipe their hook state mid-interaction). ---- */
let displayMode = "inline";
const displayModeListeners = new Set<() => void>();
function setDisplayMode(mode: string) {
  if (mode === displayMode) return;
  displayMode = mode;
  displayModeListeners.forEach((l) => l());
}
function useDisplayMode(): string {
  return React.useSyncExternalStore(
    (listener) => {
      displayModeListeners.add(listener);
      return () => displayModeListeners.delete(listener);
    },
    () => displayMode,
  );
}

/* ---- the widget ---- */
function Playground() {
  const [payload, setPayload] = React.useState<RenderPayload | null>(null);

  const { app } = useApp({
    appInfo: { name: "crail-playground", version: "0.1.0" },
    capabilities: {},
    autoResize: !(window as { __CRAIL_NORESIZE?: boolean }).__CRAIL_NORESIZE,
    onAppCreated(app) {
      appRef = app;
      beacon("app created");
      app.ontoolinput = () => {
        beacon("tool input received");
        setPayload(null);
      };
      app.ontoolresult = (result) => {
        const p = result.structuredContent as RenderPayload | undefined;
        beacon(`tool result received; view=${p?.view} sourceLen=${p?.source?.length ?? 0}`);
        if (p?.view === "render" && typeof p.source === "string") setPayload(p);
      };
      app.onteardown = async () => ({});
    },
  });

  useHostStyles(app, app?.getHostContext());

  // Crail's native theming contract is data-theme on the document root —
  // apply it from host context directly so dark mode never depends on
  // which CSS variables the host chooses to send.
  React.useEffect(() => {
    if (!app) return;
    const apply = (ctx?: { theme?: string; displayMode?: string }) => {
      if (ctx?.theme) document.documentElement.setAttribute("data-theme", ctx.theme);
      if (ctx?.displayMode) setDisplayMode(ctx.displayMode);
    };
    apply(app.getHostContext());
    app.onhostcontextchanged = (params) => apply(params.hostContext);
  }, [app]);

  // Snippets can escalate to fullscreen themselves (requestDisplayMode in
  // scope) and adapt their layout reactively via useDisplayMode().
  const requestDisplayMode = React.useCallback((mode: "inline" | "fullscreen") => {
    const current = appRef;
    if (!current) return;
    void current
      .requestDisplayMode({ mode })
      .then((res) => {
        const granted = (res as { displayMode?: string })?.displayMode ?? mode;
        setDisplayMode(granted);
        report("display mode", granted);
      })
      .catch(() => report("display mode request refused", mode));
  }, []);

  const rendered = React.useMemo(() => {
    if (!payload) return null;
    try {
      const el = evaluateSnippet(payload.source, payload.data, report, {
        useDisplayMode,
        requestDisplayMode,
      });
      beacon("snippet evaluated ok");
      return el;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushLog({ kind: "render-error", text: message });
      throw err;
    }
  }, [payload, requestDisplayMode]);

  if (!payload) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
        <Spinner />
      </div>
    );
  }

  return (
    <Boundary
      key={payload.source}
      onError={(message, stack) =>
        pushLog({ kind: "render-error", text: stack ? `${message}\n${stack}` : message })
      }
    >
      <div style={{ padding: 4 }}>{rendered}</div>
    </Boundary>
  );
}

/* Evaluation errors must not blank the card: catch at the top too. */
class Root extends React.Component<{ children: React.ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 12, font: "13px/1.5 sans-serif", color: "#b3261e" }}>
          Widget failed to evaluate: {this.state.error}
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Root>
    <Playground />
  </Root>,
);
