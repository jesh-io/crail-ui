# Build and verify — single-file discipline and testing yourself first

## The single-file build

The host sandbox blocks all network. Every byte the app needs must be in the
one HTML file the resource serves.

```ts
// vite.config.ts
import { viteSingleFile } from "vite-plugin-singlefile";
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    assetsInlineLimit: 100_000_000,   // inline EVERYTHING — fonts, images
    cssCodeSplit: false,              // one <style>, no <link> the sandbox can't fetch
    chunkSizeWarningLimit: 4096,      // single-file widgets are legitimately MBs pre-gzip
  },
});
```

- **Verify fonts actually inlined.** Grep the dist for `url(data:font` — if
  your `@font-face` sources didn't inline, every named font silently falls
  back to the system stack, and good fallbacks will hide it for months.
- **Inline navigation reference data** (the book list, the region table) into
  the bundle. A picker that needs a round-trip to populate is a picker that's
  empty.
- **Markdown renders to real elements** — a small hand-rolled renderer scoped
  to what your data actually contains beats `dangerouslySetInnerHTML` in a
  widget. If you must inject server-rendered HTML, render it server-side at
  save time from trusted input only.
- **Injecting boot data into HTML**: escape `</` (`json.replace(/</g,
  "\\u003c")`) or a `</script>` in the payload breaks out of your script tag.

### The string-surgery traps

- **Never pass a generated bundle as `String.replace`'s replacement.**
  `shell.replace("</body>", bundleTag)` treats `$&`, `` $` ``, `$'` inside
  the bundle as magic patterns. Minified code contains `$&`. One occurrence
  corrupts the composed shell into a SyntaxError — blank widget everywhere,
  build green. Always `shell.replace("</body>", () => bundleTag)`. If the
  widget ever goes app-wide blank after a build, check composed-shell
  parseability first (`node --check` on the extracted script).
- **A `file:`-linked kit brings its own React.** Two Reacts in one bundle =
  every hook-using kit component dies on a null dispatcher — at runtime, not
  build time. `resolve: { dedupe: ["react", "react-dom", "react/jsx-runtime"] }`
  is mandatory with linked kits.
- Building the app from the kit's **source** (alias `crail-ui` →
  `../crail-ui/src/kit`) keeps app and kit from drifting; a version-pinned
  kit silently diverges from the one you're designing against.
- If the bundle is embedded in the server as a generated module
  (`export const APP_HTML = "…"`), commit the generated file, mark it
  generated, and never hand-edit it.

### Ship-shape server registration

```ts
const APP_HASH = sha256(APP_HTML).slice(0, 8);
const URI = `ui://shipboard/app-${APP_HASH}`;    // cache key, not a name
```

- Hash-version the URI (hosts cache by URI per conversation; see SKILL.md
  Law 2), keep old URIs readable as aliases, and don't LIST the aliases —
  list only the current one.
- Emit `_meta.ui.resourceUri` on the TOOL (that's what hosts read from
  `tools/list` to mark it interactive). The current SDK also emits the flat
  `"ui/resourceUri"` compat key; if you're not on the SDK, emit both
  spellings yourself — 30 bytes for version-skew immunity.
- Mime type is `text/html;profile=mcp-app` (the ext-apps
  `RESOURCE_MIME_TYPE` constant). Declare a preferred frame size if you have
  an opinion (`['100%','640px']`) — under both spellings if you serve legacy
  hosts. `_meta.ui.prefersBorder: true` asks the host to draw the card border
  so you don't fake one inside the iframe.

## The harness ladder

Three rungs; climb them in order, cheapest first:

1. **No host** — serve the built HTML statically and open it in a browser.
   The app should render a labeled "waiting for a host / standalone preview
   has no data" state, not a blank page. Catches most layout work for free.
   (Serving the widget at your worker's root path gives you this rung with
   zero tooling.)
2. **Simulated host** — a small page that mounts the official `AppBridge` +
   `PostMessageTransport`, loads the REAL built bundle in a Blob-URL iframe,
   delivers a real tool result, and proxies `callServerTool` to your real
   local server. This rung must fake the hostile parts:
   - `sandbox="allow-scripts"` WITHOUT `allow-same-origin` by default — test
     the restrictive sandbox; add a `?sameorigin` flag only for visual dev.
   - Synthetic `safeAreaInsets` in fullscreen (`{ top: 12, bottom: 34 }`) so
     inset code runs on a desktop. Simulate the composer with
     `safeAreaInsets.bottom ≈ 138` and verify last-row reachability.
   - **Override `onrequestdisplaymode`** — AppBridge's default just echoes
     the current mode, so expand appears to succeed and nothing happens.
   - Drive the inline↔fullscreen transition on the SAME iframe/bridge (a
     harness that mounts a second instance silently skips collapse-restore).
   - Render `sendMessage` / `updateModelContext` traffic into a visible pane
     so the feedback loop is observable.
3. **Real host** — final check. Remember: hosts cache the bundle per
   conversation, so every bundle change needs a FRESH conversation.

Known dev-inspector landmines (they cost real hours):
- Inspectors that mount apps under `React.StrictMode` double-mount; if the
  bridge teardown on the first synthetic unmount closes the app host for
  good, apps render blank in the inspector and fine in production. Suspect
  double-mount before suspecting your code.
- Inspectors that thread the tool input through the page URL will 404/blank
  on payloads containing literal dots or on oversized inputs. Split protocol
  tests (full payloads) from widget tests (compact, URL-safe payloads)
  rather than shrinking production payloads.
- Test runners that package-manage their own cwd can shred your repo's
  node_modules — keep the test suite self-contained in its own directory.

## The smoke contract

Assert the protocol-level invariants in CI — every one of these fails silently
in production otherwise:

```
✓ every UI tool carries _meta.ui.resourceUri (count them)
✓ the ui:// resource is listed AND readable
✓ the served bundle is > 100KB and contains your app marker string
✓ every UI tool result has a non-empty text fallback
✓ structuredContent.view matches the tool's window for each show tool
✓ the data-only path (data:true / sibling tool) returns < 20KB with NO embedded resource
✓ URI matches /^ui:\/\/shipboard\/app-[0-9a-f]{8}$/   (discovered, not hardcoded)
```

Then one end-to-end domain cycle against a live server (create → act →
verify → clean up, leaving the DB exactly as found).

## Visual baselines

- Matrix: every window × {light, dark} × {inline, fullscreen}. Two widths
  minimum (~1400 and ~400) — width reflow is where sizing bugs hide.
- **Diff budget 0.3%, not 2%** — a 2% budget once masked an entire missing
  section. A budget loose enough to be quiet is loose enough to hide the bug.
- Eyeball every baseline before committing it. Green checks certify
  stability, not quality — judge real prose at real widths.
- Never regenerate all baselines blindly (`--update` re-bakes everything,
  including the broken ones): restore known-good, run plain, then update only
  the targeted views.
- A visual test that actually OPENS tabs/panes catches field-name bugs that
  protocol tests never will.

## Dev/prod asymmetry — the top bug source

Make the local runner enforce prod's constraints, never the reverse:

- Hosted SQL bindings cap bound parameters lower than local SQLite (100 vs
  999). An `IN (...unbounded ids...)` works locally and crashes in prod —
  and a polling widget re-runs the crash every 5 seconds. Never build `IN`
  from an unbounded array; use scoped scans/joins. Wrap the test DB with the
  STRICTER prod ceiling.
- Multi-tenant servers with scoped and unscoped connectors need a dev rig
  for EACH topology — a scoped rig structurally cannot catch missing-scope
  bugs in the widget's internal calls.
- FK enforcement differs across engines during table rebuilds; a migration
  that passes locally can delete child rows in prod. Rebuild child tables
  alongside, and treat every migration as a data-loss rehearsal.
