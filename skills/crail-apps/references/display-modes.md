# Display modes — inline, fullscreen, pip, and the degradation ladder

Three facts anchor everything here:

1. **Mode changes re-parent the same living iframe.** Nothing reloads; state
   survives for free. (Prove it to yourself in a new host: mount a stopwatch
   in a ref at first render and watch it keep ticking across transitions.)
2. **Asking is not getting.** The host decides.
3. **Fullscreen may simply not exist.** Design for its absence first.

## Requesting a mode

```ts
async function expand() {
  try {
    // The response is authoritative; hosts may also (or instead) push a
    // hostcontextchanged — handle both, first one wins.
    const res = await app.requestDisplayMode({ mode: "fullscreen" });
    if (res?.mode) setMode(res.mode);          // the GRANTED mode, not the requested one
  } catch {
    /* host doesn't support display modes — stay inline; the card remains fully functional */
  }
}
app.onhostcontextchanged = (hc) => { if (hc.displayMode) setMode(hc.displayMode); };
```

- Adopt `res.mode` — a host can grant `inline` when you asked for
  `fullscreen`.
- Both signal paths (response + context change) converge on one idempotent
  state set; some hosts use only one of them.
- The catch is quiet. A failed expand is not an error the user caused.

## Gate the affordance (the law everyone breaks)

```tsx
const canExpand = !host.availableDisplayModes            // unreported → offer optimistically
  || host.availableDisplayModes.includes("fullscreen");
{mode !== "fullscreen" && canExpand && <IconButton icon="expand" onClick={expand} />}
```

Audit finding: four independent production apps absorbed
`availableDisplayModes` into their bridge and then never read it — shipping
expand buttons that silently do nothing on hosts without fullscreen. Degrade
before the user taps. When the host doesn't report the field at all, offer the
mode and let the request fail visibly — absence of a capability list is not a
denial.

Also: don't ship your own collapse button when the host provides one — check
your target host's chrome before duplicating it.

## Mode is derived, never stored

Keep route + data state ABOVE the inline/fullscreen branch; derive `mode` from
host context. Then a mode flip is a re-skin, not a remount:

```tsx
function App() {
  const mode = useHostMode();                 // derived from context, not useState
  const nav = useNavState();                  // view, focus, cache — lives above the branch
  if (mode === "fullscreen") return <Portal nav={nav} />;
  if (mode === "pip")        return <PipStrip nav={nav} />;
  return <Window nav={nav} />;                // inline is the default, always
}
```

**Fullscreen is a different IA, not the same view bigger.** Inline is a
compact window with an expand door; fullscreen has the sidebar, the drawer,
the split panes. Seed the fullscreen IA from the inline payload so it opens
onto what the user was looking at — including derived entries (a payload with
a selected item seeds both the workspace AND the detail view, so closing the
detail lands somewhere real).

## The inline card is a complete product

The card must never be a teaser. If fullscreen never arrives, nothing is lost
but density:

- **Trim, don't truncate silently**: `rows.slice(0, 6)` + "+ N more — expand
  to see the board". Say what's missing.
- **Clamp prose behind a tap**: 3-line clamp, tap to expand in place.
- **In-card navigation always works**: list → detail → back, inside the card.
  The `compact` flag trims; it never disables.
- **Essential verbs are present inline**: the two pending sign-off buttons
  belong on the card, not behind the door.
- Views render the same body inline and fullscreen where possible —
  fullscreen wraps it in chrome and padding rather than replacing it.

**When expansion is impossible, `sendMessage` is a display mode.** A tapped
row can ask the model to re-render: "Open release 2.14 in Shipboard" — the
model calls the show tool, and a fresh card arrives. Navigation via the
conversation. Some views (search results, indexes) can skip the expand button
entirely and navigate only this way.

The full inline degradation ladder, in order:
1. In-place `callServerTool` navigation (same card, new payload)
2. `requestDisplayMode("fullscreen")` where a view genuinely needs room
3. `sendMessage` re-render (costs a visible turn — use for cross-context jumps)
4. **A failed call on a live host is an ERROR, not a handoff.** Never silently
   stuff the composer with a prompt because a tool call failed mid-click —
   that reads as haunted UI. Show a quiet notice instead.

## pip

Handle it explicitly even if your answer is minimal. The failure mode of
ignoring it: your typed union says `"inline" | "fullscreen"`, a pip context
change falls through both branches, and the app wedges in whatever mode it
had — or worse, two different branches disagree (`mode !== "inline"` in one
file, `mode === "fullscreen"` in another) and pip gets fullscreen chrome with
inline content.

The model implementation is a one-line status ticker:

```tsx
function PipStrip({ nav }) {
  return (
    <button className="sb-pip" onClick={() => nav.go({ view: "releases" })}>
      🚢 2 releases in flight · canary 40% · 2 sign-offs pending
    </button>
  );
}
```

One number, one glance, one tap back to the app. Strip all your own chrome —
the frame is ~200px. If you truly won't design for pip, map it to the inline
layout explicitly and write that decision down.

## Collapse behavior (a decision — default: restore the record)

Two legitimate contracts for what the inline card IS:

**Restore the record (default).** The inline card is part of the conversation
transcript — a record of what the tool returned. Fullscreen is a scratchpad.

```ts
app.ontoolresult = ({ structuredContent: p }) => { snapshot.current = p; setSeed(p); };
app.onhostcontextchanged = (hc) => {
  if (hc.displayMode === "inline") {
    // Collapse restores the original card — fullscreen browsing must never
    // leak into the transcript record.
    setMode((m) => { if (m === "fullscreen" && snapshot.current) setSeed(snapshot.current); return "inline"; });
  }
};
```

The card in the transcript still answers "where's 2.14?" even after the user
wandered three releases away in fullscreen. Choose this whenever the card
memorializes a specific answer — which is most tool results.

**Keep your place.** Route + cache live above the shell; collapse just
re-skins. Choose when the card is a live dashboard (a status board, a day
planner) whose whole point is current state, and where "what the tool
returned an hour ago" has no value. The two options differ by ~5 lines; the
decision is about meaning, not code.

## Tell the model where the user went

After in-app navigation, the model may still be discussing the release list
while the user is three levels deep in a deploy log. `updateModelContext`
costs no user turn:

```ts
void app.updateModelContext({ context: `User navigated to deploy log for 2.14 (build #88, failed step: canary-verify)` });
```

Send it on significant route changes so "what do you think?" refers to what is
actually on screen. (Don't fire it per keystroke — route changes, not
mouse moves.)
