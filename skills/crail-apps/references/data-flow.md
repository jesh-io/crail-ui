# Data flow — updating the UI without closing it

The defining capability of a real MCP app: the user acts inside the widget,
the widget updates in place, and the model is never involved. The widget never
closes; no new card is minted. This file covers the mechanisms and their
sharp edges.

## The loop

```
tool result (seed) → hydrate first paint → user acts
  → write tool via callServerTool → refetch the view's read tool → re-render
```

**Seed, don't refetch.** `structuredContent` carries the full payload; the app
paints from it directly. A first paint that refetches what it was just handed
flashes an empty/"not found" state before data lands. Hydrate from the seed,
then refetch only on navigation or after writes.

## Choosing the read mechanism (a decision, not a law)

Every UI tool has two consumers: the host (needs the widget) and any
renderless caller — the model itself, a CLI, a test (needs the data and dies
on a 600KB embedded widget; a real app once blew the model's own token limit
with an 802,000-character tool result). Three mechanisms cover this:

**Option A — `data: true` flag on the same tools the model calls.**
```ts
inputSchema: { version: z.string(),
  data: z.boolean().optional().describe("return only the structured data, no embedded widget — for callers without a renderer") }
// handler: if (args.data) return { content: [text], structuredContent: sc };  // no UI resource
```
One tool surface; the caller — the only party who knows whether a renderer
exists — makes the choice. The app polls/refetches with `data: true`
(never re-ship the shell you're running in). Same flag doubles as the
fixture generator for tests and the token-limit escape hatch for agents.
**Default choice.**

**Option B — app-only sibling tools.**
```ts
_meta: { ui: { resourceUri: URI, visibility: ["app"] } }
```
A paired query tool (`get_release_data`) returning the same payload shape from
the same builder as the show tool, invisible to the model. Choose when:
- the model's tool list must stay about *intent*, not pagination mechanics
- security review wants the model-visible surface minimal
- app queries diverge in shape from conversational queries
Describe it honestly: "Internal: the widget calls this when the user
navigates; you rarely need it directly."

**Option C — fully shared tools, no differentiation.** Simplest; fine for
small apps whose payloads are small enough that the model reading them is
harmless. Declare `visibility: ["model", "app"]` explicitly — it documents
the two-consumer design even though it's the default.

Whichever you choose: **the navigation payload and the tool-result payload
must come from the same server-side builder**, so they are identical by
construction and hydration/refetch share one code path.

## Refresh strategy (a decision, not a law)

**Default: refetch-on-action.** After every write, refetch the current view's
read tool. Simple, testable, no background traffic.

Refinements that matter:
- **One `act()` chokepoint** for mutations: `act(tool, args, { refresh?,
  toast? })` — call the tool, toast the tool's own text fallback (one string,
  two audiences), then refetch. Make refresh opt-out per call: batched
  mutations in one gesture must not refetch between calls, and card-deck UIs
  must not refetch mid-deck (it yanks the card from under the user) — refetch
  on the last card.
- **Stale-while-revalidate cache keyed `view:focus`** whenever the app has
  navigation: show cached instantly, refetch in background, spinner only on
  cache miss. Round-trips through the host's postMessage bridge are slower
  than HTTP; SWR isn't a nicety.
- **Chrome vs content:** navigation chrome (the sidebar project tree) loads
  once per fullscreen session; room content refetches after every write. A
  stale minute of chrome is fine; stale content is a bug.

**Opt-in: polling.** Poll (~5s, visibility-gated) ONLY when writers other than
this widget exist — the agent working in parallel, teammates, automation.
The costs are real; accept all of them or don't poll:
- `if (document.visibilityState !== "visible") skip` — always.
- The refresh must carry the current route's identity (`payloadId`) — a
  selected detail view must re-fetch ITSELF, not collapse to the index.
- **Polling and pagination are adversaries.** Loaded-more extras must survive
  a poll: union page-1-fresh with extras, dedupe by id, reset only when the
  view's identity genuinely changes (a filter flips).
- **Latch conditional fields.** State derived from a field the poll doesn't
  request (a presentation flag, a brand block) must be latched client-side or
  the next poll silently strips it mid-use.
- **Query budget is O(1) in rows.** A poll re-runs every 5 seconds; an N+1
  view (one query per row) becomes a permanent outage. One grouped query.
- **Fixtures die.** A widget that hydrates from the live server on mount
  clobbers synthetic payloads instantly — you test by seeding the rig's
  database, not by injecting fixtures. Pick liveness or fixture-driven tests;
  you can't have both.

## Request tokens (law, not option)

```ts
const seq = useRef(0);
async function load(view: string, args: object) {
  const my = ++seq.current;
  const res = await callTool(readToolFor(view), { ...args, data: true });
  if (my !== seq.current) return;          // superseded — drop it
  const p = res.structuredContent;
  if (p && matchesRoute(p)) setPayload(p); // never blank a working view
}
```

An `inflight` boolean is not a substitute: it silently DROPS the user's
navigation while a background refresh is mid-flight — dead spinner until the
next cycle. Monotonic token; last request wins; and clear loading state only
if still current (`finally { if (my === seq.current) setLoading(false) }`) —
otherwise a stale response unsticks the spinner for a live request. Cache by
the **requested** route key, not the returned view.

## Writes

**Optimistic echo (default).** Keep the echo as a separate overlay map applied
at render — never mutate the payload:

```ts
const [echo, dispatch] = useReducer((s, a) => ({ ...s, [a.id]: { ...s[a.id], ...a.patch } }), {});
const rowFor = (r) => echo[r.id] ? { ...r, ...echo[r.id] } : r;
// verdict paints instantly; the refetch swaps in the real rows and the echo becomes a no-op
```

**Pessimistic (choose deliberately).** `busy → await tool → refetch → clear`,
button disabled throughout. Choose when the write has consequences the user
must see confirmed before proceeding: approvals, payments, destructive
actions. The double round-trip is the price of the guarantee — say so in the
UI (spinner on the specific control, not a global freeze).

**Fire-and-forget bookkeeping.** Position/progress persistence never gates UI:
`void callTool("advance_walkthrough", {...}).catch(() => {})`. UI state
updates first, unconditionally. On restore, clamp against current content
length — the persisted position may outlive a shortened list.

## Payload contracts

- **Route identity rides in the payload**: `{ view, id?, filters? }` — treat
  it with public-URL discipline; both the server's tools and the app's
  internal nav speak it.
- **Whitelist the discriminator on ingest.** An unknown `view` must hit a
  visible `default:` (version skew message), never fall through to
  `undefined` → blank strip — and never silently coerce to some default view
  with empty data (that hides the contract violation).
- **Soft misses are payloads**, not `isError`: `{ view: "releases", error:
  "no release 2.99" }` renders the index with a message. Reserve `isError`
  for hard failures, and give it a corrective message.
- **Paging contract**: `page.total` counts rows matching the FILTERS (before
  the window); clamp limit/offset in the handler (`[1, 200]`); a focused item
  outside the window is fetched and prepended, or selection silently
  vanishes; filter args are real `WHERE` clauses so COUNT and LIMIT agree.
- **Multi-tenant scope echo**: when one server serves many tenants/projects,
  the widget can't know its scope. Stamp it on every payload
  (`sc.project = ctx.slug`); the bridge absorbs it and echoes it into every
  subsequent `callServerTool`. Symptom of forgetting: widget clicks silently
  do nothing on the unscoped connector.

## File I/O

The sandbox has no network. Bytes travel base64 through a tool call:
`FileReader.readAsDataURL → strip prefix → callTool("upload_asset", { filename,
content_type, base64 })`. Cap it (~4MB) and tell the user why in the error:
"uploads travel through the MCP message channel." Anything bigger leaves the
iframe via `openLink` to a real upload page.
