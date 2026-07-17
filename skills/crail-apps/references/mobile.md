# Mobile — safe areas, the composer, and the narrow signal

The iframe cannot see the phone. It cannot see the notch, the home indicator,
or the host's floating chat composer. Everything here is about compensating
for chrome you cannot detect.

## Safe-area insets: the three-layer fallback

**Symptom.** In fullscreen on a phone, your top bar sits under the clock; your
last row hides behind the home indicator.

**Cause.** `env(safe-area-inset-*)` resolves to **0 inside the sandboxed
iframe** — the CSS environment doesn't cross the frame boundary. The only
reliable source is the host: `hostContext.safeAreaInsets`.

**Rule.** Absorb once, publish as CSS custom properties, consume everywhere:

```ts
function applySafeArea(ctx: HostContext) {
  const r = document.documentElement.style;
  const insets = ctx.safeAreaInsets;
  for (const side of ["top", "right", "bottom", "left"] as const)
    r.setProperty(`--safe-${side}`, `${insets?.[side] ?? 0}px`);
}
// call on connect AND on every onhostcontextchanged (rotation changes insets)
```

```css
.sb-topbar { padding-top: calc(12px + var(--safe-top, env(safe-area-inset-top, 0px))); }
```

Three layers: host var wins → `env()` is the fallback (needs
`viewport-fit=cover` in the meta viewport or it's 0 even where it would work)
→ `0px` floor so `calc()` never goes invalid.

**The defensive floor.** Some hosts are touch + fullscreen and report no
insets at all. Detect and floor:

```ts
if (!insets && ctx.deviceCapabilities?.touch && ctx.displayMode === "fullscreen") {
  r.setProperty("--safe-top", "52px");     // clears the status bar / clock
  r.setProperty("--safe-bottom", "24px");  // clears the home indicator
}
```

**Ownership rules.**
- Exactly ONE element owns each inset. If the top bar pads for `--safe-top`,
  the content below it must NOT — double-padding is a real shipped bug.
- Insets are not one padding. Top/left/right go on the shell container.
  Bottom goes (a) on the scroll body for clearance and (b) INSIDE sticky
  bottom chrome (`padding-bottom: calc(var(--sp-3) + var(--safe-bottom))`) so
  the bar's background extends into the unsafe strip while its content stays
  above it. Never on the container's bottom — that lifts the sticky bar off
  the edge and leaves an unpainted gap.
- Anything `position: absolute/fixed` escapes the shell's padding and must
  explicitly re-add (or cancel) the inset:
  `top: calc(20px + var(--safe-top, 0px))` for a floating corner control;
  `top: calc(-1 * var(--gut) - var(--safe-top, 0px))` for an overlay that
  must reach the true edge.
- Left/right matter too — landscape notch. Pad drawers and nav rails with
  `--safe-left`/`--safe-right`.

**Verify.** Your harness should serve synthetic insets
(`{ top: 12, bottom: 34 }`, fullscreen only — 34 is the iPhone home-indicator
height) so this code path runs on a desktop, not for the first time on a
phone.

## The composer gutter

**Symptom.** In fullscreen, the last row of your list — often the row with the
primary action on it — sits permanently under the host's floating chat input.
On mobile it's worse: the composer floats above the home indicator, so the
hazards stack.

**Cause.** The host's composer overlays the bottom of the iframe. It is NOT
part of `safeAreaInsets`, and no host tells you its height.

**Rule.**

```css
:root { --composer-gutter: 140px; }
.sb-content {
  overflow-y: auto;
  padding-bottom: calc(var(--composer-gutter) + var(--safe-bottom, 0px));
}
```

- ~140px is the empirically stable budget across hosts. It is one named
  constant — not a magic number re-derived per view (audits keep finding it
  duplicated with drifting values and inconsistent conditions).
- It goes on **every independently scrolling pane**, not once on the shell —
  each scroller needs its own overscroll room.
- The safe-area inset is ADDED, never substituted.
- Apply it in fullscreen regardless of width — the desktop composer floats
  too.
- Inline cards don't need it; there's no composer overlay inside the card.

**Corollaries.**
- Transient UI (toasts, confirmations) lives **top-right** — the bottom is
  occupied territory.
- Never bottom-anchor an action bar in fullscreen. If a view needs a
  persistent action, put it in the top bar or inline with the content.
- Composers/editors that must appear near selected content should be
  **portaled into the document flow** right below the selection — an
  element in the flow scrolls with the content and can never fight the
  host's chrome or the safe areas. A `position: fixed` composer will lose.

**Verify.** Scroll every fullscreen pane to the very bottom in your harness
with `safeAreaInsets.bottom ≈ 138` simulated. The last interactive element
must be fully visible and tappable above the simulated composer line.

## The narrow signal

**"Mobile" means the iframe is narrow, not that the device is a phone.** An
inline card on desktop can be 380px wide; a fullscreen phone view is ~393px.
Same layout problem.

```ts
export function useIsNarrow(bp = 640) {
  const [narrow, set] = useState(() => window.innerWidth <= bp);
  useEffect(() => {
    const mq = matchMedia(`(max-width: ${bp}px)`);
    const on = () => set(window.innerWidth <= bp);
    mq.addEventListener("change", on);
    window.addEventListener("resize", on);   // BOTH — see below
    return () => { mq.removeEventListener("change", on); window.removeEventListener("resize", on); };
  }, [bp]);
  return narrow;
}
```

Subscribe with `matchMedia` AND `resize`: a display-mode transition re-parents
the iframe and reflows it without a reliable media-query change event.

What the narrow flag drives:
- touch targets: rows `min-height: 44px` (vs 34 on desktop)
- gutters: 8px (vs 12px)
- search collapses to an icon; labels drop while color dots stay (progressive
  disclosure beats truncation)
- drawer width `min(300px, 84vw)`

## Drawer + scrim (fullscreen narrow nav)

Desktop: persistent sidebar in a grid (`grid-template-columns: 208px 1fr`).
Narrow: the same tree becomes a fixed drawer —

```css
.sb-sidebar        { position: fixed; inset: 0 auto 0 0; width: min(300px, 84vw);
                     transform: translateX(-103%);   /* -103% clears the box-shadow */
                     transition: transform 200ms; z-index: 40; }
.sb-sidebar--open  { transform: none; }
.sb-scrim          { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 30; }
```

CSS decides presentation; React holds only `navOpen`. Remember the drawer pads
`--safe-left` and its top pads `--safe-top`.

## Touch niceties that get forgotten

- Guard hover styles: `@media (hover: hover) { .sb-row:hover { … } }` —
  otherwise tapped rows keep a stuck hover tint on touch screens.
- Key transient button state (e.g. "Sent ✓") by action id — one shared state
  across sibling buttons flips both labels at once.
- The iframe is the only component in the whole system that knows the user's
  local time and locale. If your domain has "today" semantics, pass
  `localDate` / `tzOffsetMinutes` explicitly from the widget — the server is
  UTC and must not guess (UTC-slicing lands evening work on tomorrow).
