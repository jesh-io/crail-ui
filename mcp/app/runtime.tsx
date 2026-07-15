/* The composable runtime: compile an AI-authored JSX snippet and evaluate it
   with the entire crail-ui kit (plus React hooks, `data`, and `report`) in
   scope. No imports needed — and forgiving if the model writes them anyway. */
import * as React from "react";
import { transform } from "sucrase";
import * as Crail from "crail-ui";

export type RenderPayload = {
  view: "render";
  source: string;
  data?: unknown;
  title?: string;
};

/* ---- module shim: `import X from "crail-ui"` lowers to require() ---- */
function shimRequire(spec: string): unknown {
  if (spec === "crail-ui") return Crail;
  if (spec === "react") return React;
  throw new Error(
    `Cannot import "${spec}" — only crail-ui components (already in scope) are available. ` +
      `Drop the import statement entirely; every component is a global here.`,
  );
}

const HOOKS = {
  useState: React.useState,
  useEffect: React.useEffect,
  useMemo: React.useMemo,
  useRef: React.useRef,
  useCallback: React.useCallback,
  useReducer: React.useReducer,
};

function compileDual(source: string): string {
  // 1) Expression form: the snippet is a single JSX expression.
  try {
    const wrapped = `const __ui = (\n${source}\n);`;
    const { code } = transform(wrapped, {
      transforms: ["jsx", "typescript"],
      production: true,
    });
    return `${code}\nreturn __ui;`;
  } catch {
    // fall through to body form
  }
  // 2) Body form: statements (hooks, helpers) that define `App`.
  const { code } = transform(source, {
    transforms: ["jsx", "typescript", "imports"],
    production: true,
  });
  return (
    `${code}\n` +
    `if (typeof App === "undefined") { throw new Error(` +
    `"Source must be a single JSX expression, or statements defining a component named App."); }\n` +
    `return React.createElement(App);`
  );
}

export type SnippetHost = {
  /** Hook: current host display mode ("inline" | "fullscreen"), reactive. */
  useDisplayMode: () => string;
  /** Ask the host to switch display modes. */
  requestDisplayMode: (mode: "inline" | "fullscreen") => void;
};

export function evaluateSnippet(
  source: string,
  data: unknown,
  report: (event: string, detail?: unknown) => void,
  host: SnippetHost,
): React.ReactNode {
  const scope: Record<string, unknown> = {
    React,
    ...HOOKS,
    ...Crail,
    data,
    report,
    useDisplayMode: host.useDisplayMode,
    requestDisplayMode: host.requestDisplayMode,
    require: shimRequire,
    exports: {},
    module: { exports: {} },
  };
  const names = Object.keys(scope);
  const body = compileDual(source);
  const fn = new Function(...names, body);
  const result = fn(...names.map((n) => scope[n])) as unknown;
  // `function App() {...}` parenthesizes into a valid *expression*, so the
  // expression path can hand back the component itself — mount it.
  if (typeof result === "function") {
    return React.createElement(result as React.ComponentType);
  }
  return result as React.ReactNode;
}

/* ---- error boundary: a render error in a host iframe is otherwise a
   silent blank box. Render the stack, and report it back to the model. ---- */
export class Boundary extends React.Component<
  { onError: (message: string, stack?: string) => void; children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError(error.message, info.componentStack ?? undefined);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <Crail.StatusBanner tone="error" title="This widget hit a render error">
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", font: "12px/1.5 var(--font-mono, monospace)" }}>
            {String(this.state.error.message)}
          </pre>
        </Crail.StatusBanner>
      );
    }
    return this.props.children;
  }
}
