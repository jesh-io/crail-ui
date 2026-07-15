/* crail-mcp — Cloudflare Worker entry (streamable HTTP, stateless).
   The official McpServer does all protocol work; this file only adapts
   fetch Request/Response to the SDK's Transport interface. Stateless JSON
   mode: every POST gets a fresh server+transport (the server holds no
   session state), and responses return as application/json — both are
   sanctioned by the streamable HTTP spec and standard for Workers. */
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import { createCrailServer, type Catalog } from "../src/core.js";
// Bundled at deploy time by wrangler (Text/JSON module rules).
// @ts-expect-error text module
import appHtml from "../dist-app/index.html";
import catalogJson from "../catalog.json";

const catalog = catalogJson as Catalog;

type Rpc = JSONRPCMessage & { id?: number | string; method?: string };

class FetchTransport implements Transport {
  onmessage?: (message: JSONRPCMessage) => void;
  onclose?: () => void;
  onerror?: (error: Error) => void;

  private out: Rpc[] = [];
  private pending = new Set<number | string>();
  private finish?: () => void;

  async start(): Promise<void> {}
  async close(): Promise<void> {
    this.onclose?.();
  }

  async send(message: JSONRPCMessage): Promise<void> {
    const m = message as Rpc;
    this.out.push(m);
    if (m.id !== undefined && !("method" in m && m.method)) {
      this.pending.delete(m.id);
      if (this.pending.size === 0) this.finish?.();
    }
  }

  /** Feed one HTTP body's messages in; resolve when every request is answered. */
  async handle(body: unknown): Promise<Rpc[]> {
    const messages = (Array.isArray(body) ? body : [body]) as Rpc[];
    for (const m of messages) {
      if (m.id !== undefined && m.method) this.pending.add(m.id);
    }
    const done =
      this.pending.size === 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => (this.finish = resolve));
    for (const m of messages) this.onmessage?.(m as JSONRPCMessage);
    await done;
    return this.out;
  }
}

const JSON_HEADERS = {
  "content-type": "application/json",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, GET, OPTIONS, DELETE",
  "access-control-allow-headers": "content-type, mcp-session-id, mcp-protocol-version, authorization",
};

/* Runs two ways:
   - standalone Worker (crail-mcp.jeshurun.workers.dev): /mcp + a plain-text /
   - Pages _worker.js on crail.jesh.dev: /mcp handled here, everything else
     falls through to the static showcase via env.ASSETS. */
type Env = { ASSETS?: { fetch: (request: Request) => Promise<Response> } };

export default {
  async fetch(request: Request, env?: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== "/mcp") {
      if (env?.ASSETS) return env.ASSETS.fetch(request);
      if (url.pathname === "/" && request.method === "GET") {
        return new Response(
          "crail-mcp — Crail as an MCP server. Connect an MCP client to POST /mcp.\n" +
            "Docs: https://crail.jesh.dev  ·  Kit: https://github.com/jesh-io/crail-ui\n",
          { headers: { "content-type": "text/plain" } },
        );
      }
      return new Response("not found", { status: 404 });
    }

    if (request.method === "OPTIONS") return new Response(null, { headers: JSON_HEADERS });

    if (request.method === "GET") {
      // No standalone SSE stream in stateless mode.
      return new Response(null, { status: 405, headers: JSON_HEADERS });
    }
    if (request.method === "DELETE") {
      // Session teardown is a no-op for a stateless server.
      return new Response(null, { status: 200, headers: JSON_HEADERS });
    }
    if (request.method !== "POST") {
      return new Response(null, { status: 405, headers: JSON_HEADERS });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32700, message: "Parse error" },
          id: null,
        }),
        { status: 400, headers: JSON_HEADERS },
      );
    }

    const server = createCrailServer(appHtml as string, catalog);
    const transport = new FetchTransport();
    await server.connect(transport);
    try {
      const responses = await transport.handle(body);
      if (responses.length === 0) return new Response(null, { status: 202, headers: JSON_HEADERS });
      const payload = responses.length === 1 ? responses[0] : responses;
      return new Response(JSON.stringify(payload), { headers: JSON_HEADERS });
    } finally {
      await server.close().catch(() => {});
    }
  },
};
