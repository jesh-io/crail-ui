# crail-mcp

**Crail as an MCP server.** Plug it into Claude and every tool result can be a
live widget in the host's own design language — Claude composes crail-ui
components into JSX on the fly, and the playground app renders it inline.

```sh
npx crail-mcp   # stdio MCP server
```

Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "crail": { "command": "npx", "args": ["crail-mcp"] }
  }
}
```

## Tools

- **`render_ui`** — the composable core. Takes `source` (JSX: one expression,
  or statements defining `App`), optional `data` (JSON available in scope),
  optional `title`. Every crail-ui component is pre-loaded in scope — no
  imports. React hooks available for interactive widgets. `report(event)` in
  handlers feeds user interactions back to the model via `updateModelContext`.
  Compile errors and unknown components come back as fixable tool errors with
  did-you-mean suggestions.
- **`list_components`** — the catalog (~70 components), grouped.
- **`get_component`** — full TypeScript prop signatures, straight from the
  kit's `.d.ts` (generated at build; can never drift).

## Architecture

- `app/` — the playground host app: one static single-file HTML
  (`ui://crail/playground`), React + the whole kit + Sucrase bundled. The
  AI-authored snippet arrives as **data** in `structuredContent`, is JSX-
  transformed in the sandbox, and evaluated with the kit injected in scope.
  Hosts cache the app; snippets never bust the cache.
- `src/server.ts` — stdio MCP server on the official
  `@modelcontextprotocol/ext-apps` helpers. Compile gate runs server-side so
  the model gets errors as tool results, before anything renders.
- `harness/` — a local MCP Apps host on the official `AppBridge` for
  self-testing without a real host: delivers a tool result, captures
  `updateModelContext` feedback, theme toggle.

## Develop

```sh
# from repo root: the kit must be built first (catalog reads dist/*.d.ts)
npm run build:lib

cd mcp
npm install
npm run build      # app → catalog → server
npm run smoke      # protocol checks over real stdio
npm run build:harness
npx http-server . # then open /dist-harness/index.html?sameorigin=1
```

Harness flags: `?sameorigin=1` (visual dev — see note), `?nohost=1` (app
without bridge), `?delay=2000` (late connect), `?noresize=1` (disable
autoResize).

**Known local quirk:** in the harness only, `sandbox="allow-scripts"` (opaque
origin) + an immediate bridge connect can leave the iframe unpainted in some
Chrome builds even though the app runs and lays out correctly (verified via
lifecycle beacons). Real hosts render this stack fine. Use `?sameorigin=1`
for visual work; re-verify in a real host before release.

## v1 scope

No registry, no auth (stdio is local; a hosted remote endpoint can wrap the
same server later). The registry — register composed components, schema-match
discovery ("what can render this data?") — is the designed next layer.
