---
name: crail-apps
description: Build MCP Apps (SEP-1865) that survive real hosts — the house-and-windows architecture, plus the laws of sizing, safe areas, the floating composer, theming, display modes, and in-place data updates that you cannot derive from the spec. Use whenever building, debugging, or reviewing an MCP server that returns interactive UI. crail-ui is the fast path; the laws hold with or without it.
---

# crail-apps — building houses with windows

An MCP app is **one real application** (the house) surfaced through **small live
views in the conversation** (the windows). Every law in this file was learned by
shipping apps into real hosts and watching them break. The spec will not tell
you any of this.

The running example is **Shipboard**, a fictional release-management app:
releases, deploy logs, sign-offs. Substitute your domain.

## The shape (non-negotiable)

**One bundle. One resource. Many tools. `structuredContent` is the router.**

```ts
const URI = `ui://shipboard/app-${APP_HASH}`;           // hash-versioned — see Law 2

registerAppResource(server, "app", URI, { mimeType: RESOURCE_MIME_TYPE },
  async () => ({ contents: [{ uri: URI, mimeType: RESOURCE_MIME_TYPE, text: APP_HTML }] }));

registerAppTool(server, "show_release", {
  inputSchema: { version: z.string(), data: z.boolean().optional() },
  _meta: { ui: { resourceUri: URI } },
}, async (args) => {
  const payload = { view: "release", version: args.version, ...(await release(args.version)) };
  return {
    content: [{ type: "text", text: fallbackFor(payload) }],   // the model's half
    structuredContent: payload,                                 // the widget's half
  };
});
```

Inside the bundle, one discriminated union routes everything:

```ts
type Payload =
  | { view: "releases"; rows: ReleaseRow[] }
  | { view: "release";  version: string; deploys: Deploy[]; signoffs: Signoff[] }
  | { view: "deploys";  entries: LogEntry[] };

app.ontoolresult = ({ structuredContent: p }) => {
  if (p?.view && KNOWN_VIEWS.includes(p.view)) { snapshot.current = p; setSeed(p); }
};
```

Do not ship a bundle per tool. Five separate widgets means five bridges, five
CSS forks, and drift; every team that started there migrated to one bundle.
At >5 views, maintain the routing as declarative maps (payload union, view →
refresh-tool map, view → component switch, sub-route → nav-parent map) —
adding a window becomes a type error until every map is updated.

## Laws

Each law is symptom → cause → rule. The **verify** steps live in
`references/build-and-verify.md`. When a law surprises you, read its
reference file — the failure stories are there.

### Architecture

1. **Wrap tool registration in a factory that forces `{ text, payload }`.**
   The text fallback is the model's only view of the UI. Write it FOR the
   model: state it can reason over plus what to do next — never "Rendered
   widget." Echo human-readable forms of machine-encoded values (minute 960 →
   "4:00pm"); it's the model's only typo check.

2. **The resource URI is a cache key, not a name.** Hosts cache the bundle by
   URI per conversation. Symptom: a new view renders as a silent blank strip —
   the chat is holding an older bundle than the server. Rule: content-hash the
   URI per build (`ui://shipboard/app-<sha256[:8]>`) AND give your view switch
   a visible `default:` case ("This chat is holding an older Shipboard than
   the server — reconnect or start a fresh chat"). Keep retired URIs
   registered, aliased to the new bundle: old transcript messages resolve them
   forever.

3. **Never throw from a tool handler** — a thrown error is a blank iframe.
   `isError` text must be corrective ("Unknown release 2.99. Available: …"),
   not a complaint. Soft misses are payloads (`{ view: "releases", error:
   "no release 2.99" }`) so the view still renders. Ship an error boundary
   that renders the stack in token-free styles (hardcoded hex + literal
   monospace — the crash you're catching may be the tokens failing to load).

4. **Official SDK only; never hand-roll the protocol.** One team's hand-rolled
   bridge was 714 lines that pinned them to a stale protocol version and
   provided no insets, no display modes, no host context. If you must support
   legacy MCP-UI hosts too: race `app.connect()` against ~2500ms, start the
   legacy listener first, and let MCP Apps win any tie. Components import
   verbs (`callTool`, `sendPrompt`), never protocols.
   → `references/build-and-verify.md`

### Data — the in-place update loop

5. **The delivered tool result is a seed, not the state.** Hydrate first paint
   from `structuredContent` (never refetch what you were just handed — the
   flash of empty state is the symptom). After that, the app updates itself
   through `callServerTool`: user acts → write tool → refetch the view's read
   tool. The model is never involved in mechanical updates; the widget never
   closes. → `references/data-flow.md` for the three mechanisms and when each
   wins.

6. **Every UI tool has two consumers.** The host needs the widget; an agent or
   CLI without a renderer dies on it (a real app once returned an 802,000-char
   result and blew the model's own token limit). Ship the escape hatch from
   day one: a `data: true` arg that returns payload only, no embedded UI.
   The app itself refetches with `data: true` — never re-ship the shell you're
   already running in.

7. **Racing fetches need monotonic request tokens, not an inflight boolean.**
   The boolean silently eats the user's click while a background refresh is
   mid-flight — dead spinner until the next cycle. Token every request; last
   one wins; a stale response must never clobber a newer route or blank a
   working view.

8. **Mechanical vs agentic.** Deterministic actions call tools directly.
   Judgment goes to `sendMessage` — with a fully scripted prompt (IDs
   interpolated, exact tool sequence named, ending "…then show me the
   release"), inside try/catch with a quiet "n/a" fallback state. Never put a
   free-text prompt box in a widget: the chat is the chat box.

### Sizing

9. **The autoResize law.** With `autoResize: true`, the app reports content
   height. `height:100%`/`100vh` on `html/body/#root` makes content height a
   function of frame height, which is a function of reported content height —
   the circularity resolves to a collapsed or runaway box. Root sizes to
   content, always. Only a deliberately-fullscreen container uses `100dvh`
   (`min-height`, with a `100vh` fallback line above it). Report height
   **inline only** — fullscreen and pip own their frame. Never hand-roll
   height reporting while SDK autoResize is on. `* { box-sizing: border-box }`
   is the kit's job — single-file apps have no CSS preflight, and without the
   reset every `width:100%` input overflows its container.

10. **Fullscreen = pinned viewport, exactly one inner scroller**
    (`overflow:hidden` shell, one `overflow-y:auto` pane, `minHeight:0`).
    Inline = avoid internal scrolling: trim lists ("+ 4 more — expand to see
    the room") or bound them with a maxHeight. → `references/sizing-and-layout.md`

### Mobile and host chrome

11. **Safe-area insets come from `hostContext.safeAreaInsets`, not `env()`** —
    `env(safe-area-inset-*)` resolves to 0 inside the sandboxed iframe.
    Publish once as CSS custom properties on `:root` (`--safe-top` …), consume
    everywhere as `calc(base + var(--safe-top, 0px))`, keep `env()` as the
    fallback layer (with `viewport-fit=cover` in the meta viewport, or `env()`
    is 0 even where it works), and ship a floor for touch+fullscreen hosts
    that report nothing. Exactly one element owns each inset — double-padding
    is a real bug. Anything `position:absolute/fixed` must explicitly cancel
    the shell's inset padding or it floats inside the notch.

12. **The composer gutter.** The host's chat input floats over the bottom of
    the frame. It is NOT in `safeAreaInsets` and the host never tells you its
    height. Reserve **~140px** of bottom padding on EVERY independently
    scrolling pane, and ADD the safe-area bottom inset on top — the two
    hazards stack. One named constant (`--composer-gutter`), not magic numbers
    scattered per view. Transient UI (toasts) lives top-right. Never
    bottom-anchor an action bar in fullscreen — the composer owns that space.

13. **"Mobile" means the iframe is narrow (~640px), not the device.**
    Subscribe with `matchMedia` AND a resize listener — display-mode
    transitions reflow without a media-query event. Touch rows ≥44px. Headers
    wrap before they overflow (flexWrap + shrinkable title). Titles wrap with
    a 2-line clamp — never ellipsize prose to ~25 chars. Never stack
    master-over-detail: split panes when wide, two views with a persistent
    back header when narrow. → `references/mobile.md`

### Display modes

14. **Asking is not getting.** `requestDisplayMode` resolves with the host's
    decision — adopt the GRANTED mode from the response, and also honor
    `onhostcontextchanged`; both routes converge on one idempotent state set.
    Some hosts answer only one way.

15. **Mode changes re-parent the same iframe — nothing reloads.** Derive mode
    from host context (never store it as app state); keep route + data state
    above the shell so a mode flip is a re-skin, not a remount. Fullscreen is
    a different IA seeded from the inline payload, not "the same view,
    bigger."

16. **The inline card is a complete product, never a teaser.** In-card
    navigation always works; prose is clamped but expandable; essential verbs
    are present. Fullscreen adds depth, not function. Where expansion is
    impossible, navigating by `sendMessage` ("Open release 2.14 in the
    reader") is a display mode. → `references/display-modes.md`

### Theme and flushness

17. **Tokens only; `data-theme` on `documentElement`; light is the bare-`:root`
    default; set `color-scheme` in both blocks.** A hardcoded palette reads as
    an ad inside the reply. Take the host's theme *variables*, never its
    *fonts* — adopting host fonts repaints every element you forgot to style;
    neutralize unwanted families by aliasing (`--font-serif: var(--font-sans)`)
    or override deliberately per content type.

18. **One dark ramp, anchored to the host's fullscreen surface.** crail-ui's
    dark `--paper-1` matches the host surface; elevation = lightness; warmth
    survives only in `--paper-tint`. Do NOT per-mode match host surfaces — an
    app that changes color on every expand/collapse is a worse artifact than a
    faint seam. (This was built, shipped, and retracted. Trust the ramp.)

19. **Root paint discipline.** Inline: transparent root, painted card surfaces
    — flush by construction. Fullscreen: painted app background (`--paper-1`)
    at `100dvh`. Stamp your default theme in the static HTML so first paint
    precedes hydration (no white flash in dark mode), and give `#root` a
    small `min-height` against the zero-height flash.
    → `references/theme-and-flush.md`

### Build and ship

20. **No network at runtime, period.** The sandbox blocks every external
    fetch. `viteSingleFile` + `assetsInlineLimit: 100_000_000` +
    `cssCodeSplit: false`. Verify fonts actually inlined as `data:` URIs — in
    a single-file widget a font-family name is a wish, and the good system
    fallbacks will hide that yours never loaded. Inline the reference data
    navigation needs. File I/O travels base64 through a tool call — cap it
    (~4MB) and say why in the error. `openLink` for anything that must leave
    the iframe, and give the model the same URL in the text fallback.

21. **Build-time string surgery is a minefield.** Never pass a generated
    bundle as `String.replace`'s replacement — minified code contains `$&`,
    which is a replace magic pattern, and one occurrence corrupts the composed
    shell into a SyntaxError while the build stays green. Always
    `replace(x, () => bundle)`. A `file:`-linked kit smuggles a second React
    into the bundle (`resolve.dedupe: ["react", "react-dom", "react/jsx-runtime"]`
    is mandatory; the symptom is a null hook dispatcher, not a build error).

22. **Test in a harness that fakes the hostile parts** — sandbox without
    `allow-same-origin`, synthetic safe-area insets, real display-mode
    round-trips — and smoke-test the contract itself: `_meta.ui` present on
    every UI tool, resource listed AND readable, bundle >100KB, text fallback
    non-empty, `data:true` path small with no resource. Re-test bundle changes
    in a FRESH conversation — hosts cache per conversation.
    → `references/build-and-verify.md`

## The gap-laws (everyone breaks these — do not)

- **Gate the expand affordance on `availableDisplayModes`.** Audit finding: four
  independent production apps all absorbed this field and ignored it, shipping
  expand buttons that silently do nothing on hosts without fullscreen. One
  line: `availableDisplayModes?.includes("fullscreen")` — degrade before the
  user taps, not after.
- **Handle `pip` explicitly, even if the answer is "render the inline layout."**
  Typed-but-unhandled pip means two branches disagree and the app wedges in
  its last mode. The model implementation: a one-line status ticker that
  navigates home on click.
- **Tell the model where the user went.** After significant in-app navigation,
  the model may still be discussing the release list while the user is deep in
  a deploy log. `updateModelContext` costs no user turn; use it on route
  changes so "what do you think?" refers to what's actually on screen.

## Decisions (options, not verdicts)

Read `references/data-flow.md` and `references/display-modes.md` before
choosing. Summary of the trade space:

| Decision | Default | Choose the other when |
|---|---|---|
| App refresh mechanism | `data: true` flag on the same tools the model calls | App-only sibling tools (`visibility: ["app"]`) when app queries shouldn't appear in the model's tool list, or when security review requires the model-visible surface to be minimal |
| Refresh strategy | Refetch-on-action | Poll (visibility-gated, ~5s) only when other writers exist (the agent, teammates, automation) — and accept the costs: fixtures can't drive views, pagination needs union+dedupe, query budget must be O(1) |
| Collapse behavior | **Restore the record**: snapshot the tool result on arrival; collapse restores it. The inline card is part of the transcript — fullscreen browsing must never rewrite what the tool answered | Keep-your-place when the card is a live dashboard rather than a memorialized answer |
| Write feedback | Optimistic echo as a separate overlay map applied at render (paint instantly; the refetch heals it) | Pessimistic (busy → await → refetch) when writes have safety consequences the user must see confirmed — approvals, payments, deletes |

## Two actors, one surface

The model is a first-class user of the house. All writes go through tools —
your click and the model's actions share one audit trail, one permission
model. Design tool results as two documents: `structuredContent` for the
human's eyes, `content.text` for the model's next move. Consequential actions
(approve, publish, close) can be *handoffs to the model* rather than buttons —
and some gestures belong to humans only; refuse the agent server-side, don't
hide the tool. → `references/two-actors.md`

**Every house serves its own operator skill.** Ship a `skill.md` from your
server's domain teaching agents how to drive the app well — when to open
windows, which tools to prefer with a user present, what the guides are.
Template: `references/app-skill-template.md`

## Reference index

- `references/sizing-and-layout.md` — circularity, scroll architecture, wrap-before-overflow, full-bleed
- `references/mobile.md` — insets, composer gutter, narrow signal, touch, drawers
- `references/data-flow.md` — the three MCPQL mechanisms, polling costs, paging, optimistic echo, latching
- `references/display-modes.md` — grant vs request, degradation ladders, pip, collapse options
- `references/theme-and-flush.md` — tokens, ramps, fonts, first-paint
- `references/build-and-verify.md` — single-file builds, harnesses, smoke contract, visual baselines
- `references/two-actors.md` — text fallbacks, handoffs, guide tools, visibility tiers, actor attribution
- `references/app-skill-template.md` — the served operator-skill convention
