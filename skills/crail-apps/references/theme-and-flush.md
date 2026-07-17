# Theme and flushness — reading native instead of embedded

The goal: the widget reads as part of the host's own interface, not as a
webpage in a box. Flushness is earned three ways — tokens, the ramp, and
first-paint discipline.

## Tokens only

**Symptom.** The widget looks like an ad inside the reply: its own palette,
its own fonts, unmoved by the host's theme toggle.

**Rule.** No hardcoded colors, ever. Every surface, line, and accent comes
from the kit's custom properties (`--paper-0..3`, `--ink-1..3`, `--line`,
`--crail`, tones). Theme arrives from the host and lands as one attribute:

```ts
// on connect and on every onhostcontextchanged
const theme = hostContext.theme;                          // "light" | "dark" | "system" | undefined
document.documentElement.dataset.theme =
  theme === "system" || !theme
    ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;
```

The kit's token blocks do the rest:

```css
:root, [data-theme="light"] { --paper-0: #ffffff; …; color-scheme: light; }
[data-theme="dark"]         { --paper-0: #373737; …; color-scheme: dark; }
```

- **Light is the bare-`:root` default** — an app that never receives a theme
  degrades to styled-light, not unstyled.
- **Set `color-scheme` in both blocks** — native form controls and scrollbars
  follow the theme for free.
- The host's word beats the OS's: `prefers-color-scheme` is only the fallback
  for `system`/absent.

## Fonts are voice, not theme

Take the host's theme *variables*; take its *fonts* only if your app's voice
is the host's voice. Adopting host fonts wholesale repaints every element you
forgot to style — one team watched all their row titles turn editorial-serif
overnight because the host's content font leaked into unstyled elements.

- Opt into style variables, not font adoption, in the SDK hooks.
- Neutralize a token family you don't want: `:root { --font-serif:
  var(--font-sans) }`.
- Override deliberately per content type: an app rendering long-form reading
  content may pin a real book face for the prose while all chrome stays on
  the kit sans — override the token at the content element, on purpose, with
  a comment.

## The dark ramp (and the trap that was shipped and retracted)

crail-ui's dark ramp is anchored to the host's fullscreen surface:

```css
/* Anchored to the host's fullscreen surface. Its boxes are near-neutral; a
   warm dark card on that ground reads as a seam. Elevation = lightness. */
[data-theme="dark"] {
  --paper-0: #373737;   /* raised cards, inputs */
  --paper-1: #2c2c2c;   /* app background = the host surface */
  --paper-2: #262626;   /* wells, section headers */
  --paper-3: #424242;   /* pressed / hover */
  --paper-tint: #3a352e; /* warmth survives only here */
  --line: rgba(255,255,255,0.14);
  --line-strong: rgba(255,255,255,0.27);
}
```

Principles baked into those numbers:
- **Elevation = lightness.** Cards float above the field; wells step below it.
- **Near-neutral.** The host's surfaces are near-neutral; warmth belongs in
  one tint token, not the ground.
- **One ramp for both display modes.** The host may paint its inline widget
  box and its fullscreen surface slightly different colors. Do NOT chase them
  with per-mode ramps — that was built, and it made the app visibly change
  color on every expand/collapse, a far worse artifact than a faint seam at
  the card edge. Anchor to the larger (fullscreen) surface and accept the
  seam. If you keep a `data-mode` attribute on `<html>` for future
  mode-scoped styling, fine — just don't couple colors to it.
- App-local token overrides are how you experiment; promote them into the kit
  only once the values are proven, and gate the promotion on pixel-stable
  visual baselines (it should be a refactor, not a redesign).

If your app targets a specific host, sample its actual surface colors and
anchor `--paper-1` to the fullscreen one. If it targets many hosts, keep the
kit defaults — they're calibrated for the most common host.

## Root paint discipline

**Inline: transparent root, painted cards.**

```css
html, body { margin: 0; padding: 0; background: transparent; }
```

The iframe paints nothing at the root; the card (`--paper-0` + border +
radius) is the only painted surface, and the host's own background shows
through around it. Flush by construction — no color to match, nothing to get
wrong. Sticky chrome inside the card paints `--paper-0` deliberately, because
it must occlude scrolling content.

**Fullscreen: painted app background.** The app owns the viewport: paint
`--paper-1` on the shell at `100dvh`. A transparent fullscreen root shows
whatever the host has back there — not yours to depend on.

Same bundle, both behaviors, decided by display mode.

## First paint

**Symptom.** A white flash before the widget hydrates, glaring in dark mode.

**Rules.**
- Stamp your most likely theme in the static HTML: `<html data-theme="dark">`
  (or light — pick your audience). The context-driven theme sync corrects it
  post-connect; the stamp only covers the pre-hydration frames.
- If you paint the body from tokens, that CSS is in the `<head>` of the
  single-file bundle — it applies before React mounts.
- `#root { min-height: 40px }` so the pre-hydration frame can't collapse to
  zero height.
- Gate the first meaningful render on handshake + seed
  (`if (!app || !seed) return <Spinner/>`) — never render against a
  half-payload.

## Color is data

In a widget, decoration competes with the host's own chrome. Reserve color for
meaning: status tones, identity dots, the accent on the one primary action.
When a narrow layout forces cuts, drop the label and keep the color dot — a
16px dot carries identity better than eight ellipsized characters. Motion, if
any, is a small named vocabulary (a few keyframes, one easing curve,
120–260ms) with a `prefers-reduced-motion` escape — not per-component
improvisation.
