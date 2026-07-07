# Crail

**An MCP tool UI kit in Claude's design language.**

Most MCP tools bolt a foreign interface onto a conversation. Crail takes the
opposite view: match the host's design language — warm paper, a serif voice,
one terracotta accent — so a tool result reads as part of the reply, not an ad
inside it.

Named for the terracotta (`#D97757`) Claude is known by.

**Showcase & docs → [crail.jesh.dev](https://crail.jesh.dev)** — every
component with variants, plus fully rendered chat scenarios. Flip on
*Inspect components* in a scenario to see every kit component outlined and
named in place.

## Install

```sh
npm install crail-ui
```

React 18+ and a bundler that handles CSS imports (Vite, Next.js, etc.) are
assumed.

```tsx
import { ToolCallBlock, StatCard, StatRow, ConfirmationCard } from "crail-ui";
import "crail-ui/fonts.css"; // optional — self-hosted fonts via Fontsource

function SpendingResult() {
  return (
    <ToolCallBlock
      tool="get_spending_totals"
      server="copilot-money"
      status="success"
      duration="0.4s"
      params={{ period: "2026-06" }}
    >
      <StatRow>
        <StatCard label="Total spent" value="$4,286" delta="8% vs May" direction="down" />
        <StatCard label="Saved" value="$5,414" delta="+$610" direction="up" />
      </StatRow>
    </ToolCallBlock>
  );
}
```

Importing from `crail-ui` pulls in the design tokens and component styles
automatically. Dark mode is one attribute: set `data-theme="dark"` on any
ancestor (usually `<html>`).

## What's inside

- **Tokens** — the full design system as CSS custom properties, light and
  dark. Components never hardcode a color; retheme everything by overriding
  tokens.
- **Primitives** — Button, Badge, Chip, Avatar, Card, Input, Select,
  Checkbox, Radio, Switch, Slider, Tabs, Segmented, Tooltip, Kbd, Spinner,
  ProgressBar, Skeleton, KeyValue, Menu, Modal, Toast, EmptyState.
- **Chat chrome** — ChatFrame, UserMessage, AssistantMessage, ThinkingBlock,
  ContextDivider, ToolCallBlock, CodeBlock, ChatInput, SuggestionChips.
- **Layout** — Disclosure, Accordion, CollapsibleCard, SplitView (draggable,
  keyboard-nudgeable divider), Sheet (side/bottom, portal + scrim + Escape),
  Fullscreen takeover, and Expandable — wrap any widget to give it an
  open-full-screen affordance.
- **Tool widgets** — StatCard, BarChart, LineChart, DonutChart, DataTable,
  ListManager, FileCard, MediaCard, StatusBanner, ConfirmationCard,
  ElicitationCard, ProgressTracker, TaskChecklist, LogViewer, DiffView,
  Timeline, EntityCard.

## Design rules the kit encodes

- Warm ivory paper (`#FAF9F5`) and warm ink — never pure gray.
- One terracotta accent per view; status colors stay muted (moss, amber,
  clay red, denim).
- Three type voices: serif for the assistant and display numerals, a quiet
  grotesque for chrome, mono for anything the machine said verbatim.
- Tool results render as widgets, not JSON; the request stays visible
  verbatim inside the tool block.
- Nothing writes without a ConfirmationCard — the diff or key-value detail
  *is* the approval UI.

## Develop

```sh
npm install
npm run dev        # showcase at http://localhost:5183
npm run build:lib  # compile the package to dist/
npm run build      # package + static showcase site
```

The kit lives in `src/kit/`; the showcase storybook in `src/showcase/`.

## License

[MIT](LICENSE)
