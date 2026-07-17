# Sizing and layout — the circularity and its cousins

Every rule here follows the same format: **symptom → cause → rule → verify.**
Examples use Shipboard, a fictional release-management app.

## The autoResize circularity

**Symptom.** Dead space under your inline card; the card stops tracking content
growth; or the frame ratchets taller on every interaction until the host clamps
it.

**Cause.** With `autoResize: true` the SDK measures the document and reports
content height to the host. If `html`, `body`, or `#root` carries
`height: 100%` / `min-height: 100%` / `100vh`, content height becomes a
function of the iframe height — which is a function of the height you just
reported. The loop resolves to a collapsed box or a runaway one.

**Rule.**
```html
<style>
  /* Size to content — never pin root to the viewport (autoResize law). */
  html, body { margin: 0; padding: 0; background: transparent; }
</style>
```
- No height on the root chain, ever.
- The one deliberately-fullscreen container opts in with
  `min-height: 100dvh` (min-height so content can exceed it; `dvh` is
  viewport-relative and safe where percentages are not). Write the fallback
  first: `height: 100vh; height: 100dvh;` — old mobile browsers take the
  first line, everyone else the second.
- Report height **inline only**. In fullscreen and pip the host owns the
  frame; reporting there starts a size war.
- If you hand-roll height reporting for a legacy path: measure
  `document.documentElement.scrollHeight`, observe `document.body` with a
  ResizeObserver, and dead-band the report (skip deltas ≤4px) — reporting
  height changes height.
- Never run manual reporting while SDK autoResize is active. Two reporters =
  duplicate size wars.

**Verify.** Render the inline card, then expand a disclosure inside it. The
frame must grow and shrink with the content, with no residual gap below the
card. Then check fullscreen: the frame must NOT resize as inner content
changes.

## Zero-margin, border-box, or everything overflows

**Symptom.** A `width: 100%` text input pokes out of its card; the whole
widget renders with an 8px letterbox.

**Cause.** Single-file MCP apps load no CSS framework and no preflight. The
browser default is `box-sizing: content-box` and `body { margin: 8px }`.

**Rule.** The kit owns the reset (`* , *::before, *::after { box-sizing:
border-box }` ships in crail-ui's kit.css); your static HTML zeroes the body
(`html, body { margin: 0; padding: 0 }`). This matters doubly once padding is
`calc(140px + env(...))` — content-box math would push your reported height
past the container.

## Scroll architecture

**Inline: don't scroll — trim.**
```tsx
{rows.slice(0, 6).map(r => <ReleaseRow key={r.id} {...r} />)}
{rows.length > 6 && <Hint>+ {rows.length - 6} more — expand to see the board</Hint>}
```
An inline card with an internal scroller fights autoResize (content height is
no longer a pure function of content) and reads as a webpage embedded in a
chat. Trim lists, clamp prose behind a disclosure, keep height honest. If you
must bound a list inline, use a fixed `maxHeight` (320–400px) and accept the
internal scroll consciously.

**Fullscreen: one scroller, pinned shell.**
```css
.sb-shell   { height: 100vh; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; }
.sb-content { flex: 1; overflow-y: auto; min-height: 0; }   /* the ONE scroller */
```
`min-height: 0` is load-bearing — flex children default to `min-height: auto`
and refuse to shrink, which silently disables the scroller. Sidebars are
`position: sticky; max-height: 100dvh; overflow-y: auto` — a bounded scroller
inside a viewport-sized shell, never a height-reporting participant.

**Verify.** In fullscreen, scroll every pane to the bottom. Exactly one
element scrolls; the page body never does; the frame never grows.

## Sticky chrome over scrolling content

Sticky bars must be painted (`background: var(--paper-0)`) and z-indexed, or
content scrolls *through* them. Any element carrying both a `max-width` and a
JS-injected padding must be `box-sizing: border-box` or the two fight.

```css
.sb-bar     { position: sticky; top: 0;    z-index: 5; background: var(--paper-0); border-bottom: 1px solid var(--line); }
.sb-actions { position: sticky; bottom: 0; z-index: 5; background: var(--paper-0); border-top:    1px solid var(--line); }
.sb-body    { max-width: 620px; margin: 0 auto; box-sizing: border-box; }
```

## Wrap before overflow

**Symptom.** On a narrow inline card, header controls push the card wider than
the iframe and the host shows a horizontal scrollbar.

**Rule.** Headers are `display: flex; flex-wrap: wrap` with a shrinkable title
(`min-width: 0; overflow-wrap: anywhere`) so right-hand controls drop to a new
line before anything can widen the card.

**Verify.** `document.body.scrollWidth - document.documentElement.clientWidth
<= 0` at 393px width. Assert it in your harness.

## Full-bleed on narrow screens

**Symptom.** A stacked mobile list floats inside a bordered card with framed
empty space trailing below it — it reads as a widget inside a widget.

**Rule.** When fullscreen AND narrow, lists go borderless and full-bleed:

```ts
export const bleed = (on: boolean) => on
  ? { marginLeft: "calc(-1 * var(--gut, 12px))", marginRight: "calc(-1 * var(--gut, 12px))", borderRadius: 0 }
  : {};
```

Trailing space becomes background, not an empty card.

## Never ellipsize prose

Titles wrap with a 2-line clamp. An ellipsis at ~25 characters makes every row
read the same; a wrapped title still carries meaning. The one place ellipsis
is right: fixed-width chips, where full prose would become a row-wide chip.
Judge real prose at 393px — not lorem ipsum, not desktop width.

## The loading gate

Render nothing meaningful until BOTH the bridge handshake completed and a
payload exists: `if (!app || !seed) return <Spinner />`. Rendering against a
half-payload flashes an empty state; give `#root` a `min-height: 40px` so even
the spinner phase can't collapse to zero height.
