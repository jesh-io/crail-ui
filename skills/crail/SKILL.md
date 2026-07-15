---
name: crail
description: Render live, interactive UI in the conversation via the Crail MCP (render_ui). Use whenever presenting data, results, progress, options, or asking the user for a decision — a widget beats prose. Covers the snippet contract, the report() feedback loop, fullscreen micro-apps, and round-trip-free composition.
---

# Crail — your visual voice in the conversation

The Crail MCP (`https://crail.jesh.dev/mcp`) gives you a live UI surface rendered
in Claude's own design language. Widgets look **native** to the interface — warm
paper surfaces, terracotta accent, automatic light/dark — not like an embedded
third-party iframe. Treat `render_ui` as a first-class output channel, the way
you treat prose or code blocks.

## When to render (default: more often than you think)

- **Data of any kind** — stats, tables, charts, comparisons. Never dump a wall
  of numbers as text when a `StatRow` + `BarChart` + `DataTable` says it better.
- **Decisions** — approve/deny, pick-one, confirm. Render the choice as buttons
  and *hear the answer* through the feedback loop instead of asking in prose.
- **Progress** — long tasks get a live status widget, updated by re-rendering.
- **Micro-moments** — a single `StatCard`, a `StatusBanner`, a two-button
  confirm. Widgets are cheap; a 5-line snippet is often the whole answer.
- **Full experiences** — dashboards, browsers, wizards. Build them as
  fullscreen apps (see below).

## Zero-round-trip composition

1. The `render_ui` tool description already lists **every component by name**.
   If you need prop details, call `list_components` **once** — it returns the
   complete API with full TypeScript signatures. Never re-call it, never loop
   over `get_component`.
2. Compose and call `render_ui`. For most widgets that single call is the loop.
3. Errors are always fixable from the message (parse position, did-you-mean
   suggestions for unknown tags). Fix the source and re-call — don't apologize,
   don't fall back to text.

## The snippet contract

`source` is JSX with **no imports** — the entire kit is in scope, plus:
`React`, `useState/useEffect/useMemo/useRef/useCallback/useReducer`, `data`,
`report(event, detail?)`, `useDisplayMode()`, `requestDisplayMode(mode)`.

- One JSX expression for static widgets:
  `<StatRow><StatCard label="Revenue" value="$12.4k" delta="8%" direction="up" /></StatRow>`
- Or statements defining `App` for stateful ones:
  `function App() { const [i, setI] = useState(0); return <Tabs tabs={...} active={i} onChange={setI} />; }`
- Pass the real payload via the `data` argument, reference it as `data` in JSX.
  Don't inline large JSON literals into the source string.
- Never hardcode colors/fonts (the host themes everything); layout styles
  (flex/grid/gap/padding) via `style` are fine.

## The feedback loop — widgets talk back

Everything the widget reports arrives to you silently as "Playground feedback":
`report()` calls, console output, render errors. **Wire `report()` into every
interactive element**, with enough detail to act on:

```jsx
<Button onClick={() => { setOk(true); report("user approved invoice", { id: data.id }); }}>
  Approve
</Button>
```

Then respond to what happened — re-render the widget in its new state, call
your other tools with the user's choice, or answer in prose. A rendered widget
is a two-way channel: render → user acts → you hear it → you act.

## Inline card vs. fullscreen app

- **Inline** = compact card: headline stats, short lists, one clear action.
- Widgets escalate **themselves**: put an expand `IconButton` in the card
  calling `requestDisplayMode("fullscreen")`, and branch layout on
  `useDisplayMode()` — mode changes re-render in place without losing state.
- Fullscreen = own the page: wrap in a `min-height: 100dvh` container, use
  `Tabs`/`MasterDetail`/`DataTable` for real navigation. This is where you
  build full micro-apps on the fly.
- For browse-and-inspect flows, reach for `MasterDetail` — a selection-aware
  list+detail layout with a resizable divider (`variant="split"`), an
  inspector-panel mode (`variant="overlay"`), `side="right"` to flip, and
  mobile behavior baked in (it watches its own width: split → stacked pages
  with a back header, overlay → bottom card). Pass the list as `master`, the
  selected item's view as `detail` (null when nothing picked), and clear your
  selection in `onClose`.

```jsx
function App() {
  const mode = useDisplayMode();
  const [tab, setTab] = useState(0);
  if (mode !== "fullscreen") return (
    <Card>
      <StatRow>…headline…</StatRow>
      <IconButton icon="expand" label="Expand" onClick={() => requestDisplayMode("fullscreen")} />
    </Card>
  );
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", gap: 16 }}>
      <Tabs tabs={[{ label: "Overview" }, { label: "Details" }]} active={tab} onChange={setTab} />
      {tab === 0 ? <StatRow>…</StatRow> : <DataTable columns={…} rows={data.rows} />}
    </div>
  );
}
```

## Iterating

Hosts render each `render_ui` result as its own widget. To "update" a widget,
call `render_ui` again with the evolved source/data — narrate the change in a
short sentence so the user knows why a new card appeared.
