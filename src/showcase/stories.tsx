import { useState, type ReactNode } from "react";
import {
  Icon,
  ICON_NAMES,
  Disclosure,
  Accordion,
  CollapsibleCard,
  SplitView,
  Sheet,
  Fullscreen,
  Expandable,
  Button,
  IconButton,
  Badge,
  Chip,
  Avatar,
  Card,
  Field,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Switch,
  Slider,
  Tabs,
  Segmented,
  Tooltip,
  Kbd,
  Spinner,
  ProgressBar,
  Skeleton,
  KeyValue,
  Menu,
  ModalExample,
  Toast,
  EmptyState,
  UserMessage,
  AssistantMessage,
  ThinkingBlock,
  ContextDivider,
  ToolCallBlock,
  CodeBlock,
  Kw,
  Str,
  Com,
  Num,
  Fn,
  ChatInput,
  SuggestionChips,
  StatCard,
  StatRow,
  BarChart,
  LineChart,
  DonutChart,
  DataTable,
  ListManager,
  ListRow,
  FileCard,
  FileGrid,
  MediaCard,
  StatusBanner,
  ConfirmationCard,
  ElicitationCard,
  ProgressTracker,
  TaskChecklist,
  LogViewer,
  DiffView,
  Timeline,
  EntityCard,
} from "../kit";

export type Section = {
  title: string;
  note?: string;
  well?: boolean;
  center?: boolean;
  render: () => ReactNode;
};

export type Story = {
  id: string;
  nav: string;
  group: string;
  title: string;
  lede: ReactNode;
  sections: Section[];
};

/* ════════════════ Foundations ════════════════ */

const SWATCHES: Array<{ name: string; varName: string; note: string }> = [
  { name: "Paper 0", varName: "--paper-0", note: "raised surfaces" },
  { name: "Paper 1", varName: "--paper-1", note: "app background" },
  { name: "Paper 2", varName: "--paper-2", note: "wells & sidebars" },
  { name: "Paper 3", varName: "--paper-3", note: "pressed states" },
  { name: "Paper tint", varName: "--paper-tint", note: "user bubbles" },
  { name: "Ink 1", varName: "--ink-1", note: "primary text" },
  { name: "Ink 2", varName: "--ink-2", note: "secondary text" },
  { name: "Ink 3", varName: "--ink-3", note: "placeholders" },
  { name: "Crail", varName: "--crail", note: "the accent" },
  { name: "Crail strong", varName: "--crail-strong", note: "hover & active" },
  { name: "Moss", varName: "--moss", note: "success" },
  { name: "Amber", varName: "--amber", note: "warning" },
  { name: "Clay red", varName: "--clay-red", note: "danger" },
  { name: "Denim", varName: "--denim", note: "info" },
];

const colors: Story = {
  id: "colors",
  nav: "Colors",
  group: "Foundations",
  title: "Color",
  lede: (
    <>
      Warm paper, warm ink, one terracotta accent. Every value is a CSS custom
      property, so the whole kit re-themes by flipping <code>data-theme</code> —
      try the toggle in the sidebar.
    </>
  ),
  sections: [
    {
      title: "Tokens",
      note: "Semantic names, not raw hexes — components never hardcode color.",
      render: () => (
        <div className="sb-swatches">
          {SWATCHES.map((s) => (
            <div key={s.varName} className="sb-swatch">
              <div className="sb-swatch__color" style={{ background: `var(${s.varName})` }} />
              <div className="sb-swatch__body">
                <div className="sb-swatch__name">{s.name}</div>
                <div className="sb-swatch__val">{s.varName}</div>
                <div className="sb-swatch__val">{s.note}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Tones in use",
      note: "Status colors stay muted and warm — they whisper, never shout.",
      render: () => (
        <div className="sb-col">
          <StatusBanner tone="info" title="Read-only mode">
            This connector is in beta, so write actions are disabled.
          </StatusBanner>
          <StatusBanner tone="success" title="Synced 4 minutes ago" />
          <StatusBanner tone="warning" title="2 items need review">
            Duplicate transactions were detected in June.
          </StatusBanner>
          <StatusBanner tone="error" title="Connection lost">
            The server stopped responding. Retry, or check its status page.
          </StatusBanner>
        </div>
      ),
    },
  ],
};

const typography: Story = {
  id: "typography",
  nav: "Typography",
  group: "Foundations",
  title: "Typography",
  lede: (
    <>
      Three voices: a serif for the assistant and for display, a quiet grotesque
      for interface chrome, and a mono for anything the machine said verbatim.
    </>
  ),
  sections: [
    {
      title: "The three families",
      render: () => (
        <div>
          <div className="sb-type-row">
            <span className="sb-type-meta">serif · display<br />Source Serif 4</span>
            <span style={{ font: "600 2.1rem/1.2 var(--font-serif)", letterSpacing: "-0.02em" }}>
              Tools that feel native to the assistant
            </span>
          </div>
          <div className="sb-type-row">
            <span className="sb-type-meta">serif · assistant<br />17 / 1.65</span>
            <span style={{ font: "400 1.0625rem/1.65 var(--font-serif)" }}>
              The assistant speaks in a book face. Prose set this way reads as a
              voice, not as interface — which is exactly the distinction the rest
              of the kit is built around.
            </span>
          </div>
          <div className="sb-type-row">
            <span className="sb-type-meta">sans · interface<br />Hanken Grotesk</span>
            <span style={{ font: "400 0.875rem/1.55 var(--font-sans)" }}>
              Chrome is set in a neutral grotesque: labels, buttons, table cells,
              metadata. It stays small, medium-weight, and out of the way.
            </span>
          </div>
          <div className="sb-type-row">
            <span className="sb-type-meta">mono · machine<br />JetBrains Mono</span>
            <span style={{ font: "400 0.78rem/1.6 var(--font-mono)" }}>
              {"{ \"tool\": \"get_spending_totals\", \"period\": \"2026-06\" }"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Voice pairing in a message",
      note: "Serif voice, sans chrome, mono payload — all three in one exchange.",
      render: () => (
        <div className="sb-col" style={{ maxWidth: 640 }}>
          <AssistantMessage>
            <p>
              June came in at <strong>$4,286</strong> — about 8% under May. The
              only category that grew was <em>subscriptions</em>, and one of
              those looks like a duplicate.
            </p>
          </AssistantMessage>
          <KeyValue
            mono
            rows={[
              ["server", "copilot-money"],
              ["tool", "get_spending_totals"],
              ["latency", "412ms"],
            ]}
          />
        </div>
      ),
    },
  ],
};

const icons: Story = {
  id: "icons",
  nav: "Iconography",
  group: "Foundations",
  title: "Iconography",
  lede: (
    <>
      A single stroke family on a 24-unit grid, 1.75px weight, rounded joins.
      Icons are quiet by default — they take color from text, never from a fill.
    </>
  ),
  sections: [
    {
      title: `Set — ${ICON_NAMES.length} glyphs`,
      render: () => (
        <div className="sb-icon-grid">
          {ICON_NAMES.map((n) => (
            <div key={n} className="sb-icon-cell">
              <Icon name={n} size={18} />
              <span>{n}</span>
            </div>
          ))}
        </div>
      ),
    },
  ],
};

/* ════════════════ Primitives ════════════════ */

const buttons: Story = {
  id: "buttons",
  nav: "Buttons",
  group: "Primitives",
  title: "Buttons",
  lede: (
    <>
      One terracotta primary per view; everything else stays on paper. Danger has
      a soft form for row actions and a filled form for points of no return.
    </>
  ),
  sections: [
    {
      title: "Variants",
      render: () => (
        <div className="sb-row">
          <Button variant="primary">Approve changes</Button>
          <Button variant="secondary">Preview</Button>
          <Button variant="ghost">Dismiss</Button>
          <Button variant="danger-soft">Remove</Button>
          <Button variant="danger">Delete forever</Button>
        </div>
      ),
    },
    {
      title: "Sizes & icons",
      render: () => (
        <div className="sb-row">
          <Button variant="primary" size="lg" icon="send">
            Send report
          </Button>
          <Button variant="secondary" icon="refresh">
            Re-run tool
          </Button>
          <Button variant="secondary" size="sm" iconAfter="external">
            Open in app
          </Button>
          <IconButton icon="copy" label="Copy" />
          <IconButton icon="dots" label="More" />
          <IconButton icon="trash" label="Delete" size="sm" />
        </div>
      ),
    },
    {
      title: "States",
      render: () => (
        <div className="sb-row">
          <Button variant="primary" disabled>
            Approve changes
          </Button>
          <Button variant="secondary" disabled>
            Preview
          </Button>
          <Button variant="secondary" icon="refresh" disabled>
            Syncing…
          </Button>
        </div>
      ),
    },
  ],
};

const badges: Story = {
  id: "badges",
  nav: "Badges & Chips",
  group: "Primitives",
  title: "Badges & chips",
  lede: (
    <>
      Badges state facts; chips are touchable. If it filters, selects, or
      removes, it's a chip. If it just labels, it's a badge.
    </>
  ),
  sections: [
    {
      title: "Badges",
      render: () => (
        <div className="sb-row">
          <Badge>Draft</Badge>
          <Badge tone="crail">Beta</Badge>
          <Badge tone="moss" dot>
            Connected
          </Badge>
          <Badge tone="amber" dot>
            Needs review
          </Badge>
          <Badge tone="red" dot>
            Failing
          </Badge>
          <Badge tone="denim">Read-only</Badge>
          <Badge outline>v2.4.0</Badge>
        </div>
      ),
    },
    {
      title: "Chips",
      note: "Active chips take the soft accent; removable chips grow an ×.",
      render: () => (
        <div className="sb-row">
          <Chip icon="filter">All servers</Chip>
          <Chip active icon="dollar">
            copilot-money
          </Chip>
          <Chip>linear</Chip>
          <Chip removable>June 2026</Chip>
          <Chip removable>category: dining</Chip>
        </div>
      ),
    },
    {
      title: "Avatars",
      render: () => (
        <div className="sb-row">
          <Avatar initials="JD" size={40} />
          <Avatar initials="C" tone="crail" size={40} />
          <Avatar initials="MK" tone="ink" size={40} />
          <Avatar initials="AR" size={28} />
          <Avatar initials="+3" size={28} />
        </div>
      ),
    },
  ],
};

const inputs: Story = {
  id: "inputs",
  nav: "Inputs",
  group: "Primitives",
  title: "Inputs",
  lede: (
    <>
      Fields are white cards on the paper. Focus is a terracotta ring — the same
      signal everywhere something is listening to you.
    </>
  ),
  sections: [
    {
      title: "Text fields",
      render: () => (
        <div className="sb-grid-2" style={{ maxWidth: 720 }}>
          <Field label="Budget name" hint="Shown in monthly reports.">
            <Input placeholder="e.g. Dining out" />
          </Field>
          <Field label="Search transactions">
            <Input icon="search" placeholder="Merchant, amount, or note…" />
          </Field>
          <Field label="Monthly limit" error="Enter an amount above $0.">
            <Input defaultValue="$0" error />
          </Field>
          <Field label="Category">
            <Select
              options={["Dining out", "Groceries", "Transport", "Subscriptions"]}
              defaultValue="Subscriptions"
            />
          </Field>
        </div>
      ),
    },
    {
      title: "Textarea",
      render: () => (
        <div style={{ maxWidth: 480 }}>
          <Field label="Note to reviewer" hint="Included with the approval request.">
            <Textarea placeholder="Why does this change need to happen?" />
          </Field>
        </div>
      ),
    },
  ],
};

const selection: Story = {
  id: "selection",
  nav: "Selection controls",
  group: "Primitives",
  title: "Selection controls",
  lede: (
    <>
      Checks, radios, switches, and a slider — all sharing the same 17px control
      metrics and the same terracotta checked state.
    </>
  ),
  sections: [
    {
      title: "Checkboxes & radios",
      render: () => (
        <div className="sb-row sb-row--start" style={{ gap: 48 }}>
          <div className="sb-col">
            <Checkbox label="Include pending transactions" defaultChecked />
            <Checkbox label="Group by merchant" />
            <Checkbox label="Email me the summary" defaultChecked />
          </div>
          <div className="sb-col">
            <Radio name="period" label="Last 30 days" defaultChecked />
            <Radio name="period" label="This quarter" />
            <Radio name="period" label="Custom range…" />
          </div>
        </div>
      ),
    },
    {
      title: "Switches & slider",
      render: () => (
        <div className="sb-col" style={{ maxWidth: 380 }}>
          <Switch label="Ask before every write action" defaultChecked />
          <Switch label="Auto-categorize new transactions" />
          <div style={{ marginTop: 8 }}>
            <span className="sb-spec-label">alert threshold — 65%</span>
            <Slider value={65} />
          </div>
        </div>
      ),
    },
  ],
};

const tabs: Story = {
  id: "tabs",
  nav: "Tabs & Segmented",
  group: "Primitives",
  title: "Tabs & segmented controls",
  lede: (
    <>
      Tabs divide a page; segmented controls divide a widget. Tabs get an accent
      underline, segments get a raised paper thumb.
    </>
  ),
  sections: [
    {
      title: "Tabs",
      render: () => (
        <Tabs
          tabs={[
            { label: "Overview" },
            { label: "Transactions", count: 128 },
            { label: "Recurring", count: 12 },
            { label: "Rules" },
          ]}
        />
      ),
    },
    {
      title: "Segmented",
      render: () => (
        <div className="sb-row">
          <Segmented
            options={[
              { label: "Chart", icon: "chart" },
              { label: "Table", icon: "table" },
              { label: "Raw", icon: "code" },
            ]}
          />
          <Segmented options={[{ label: "Week" }, { label: "Month" }, { label: "Year" }]} />
        </div>
      ),
    },
  ],
};

const surfaces: Story = {
  id: "surfaces",
  nav: "Cards & Layout",
  group: "Primitives",
  title: "Cards & layout",
  lede: (
    <>
      Three surface levels: raised card, flat card, and well. Key-value grids
      handle most structured detail without inventing a new layout.
    </>
  ),
  sections: [
    {
      title: "Surfaces",
      render: () => (
        <div className="sb-grid-2">
          <Card>
            <strong style={{ font: "600 0.875rem/1.3 var(--font-sans)" }}>Raised card</strong>
            <p style={{ font: "400 0.8125rem/1.5 var(--font-sans)", color: "var(--ink-2)", margin: "6px 0 0" }}>
              Default container for widget content. Hairline border, whisper of
              shadow.
            </p>
          </Card>
          <Card flat>
            <strong style={{ font: "600 0.875rem/1.3 var(--font-sans)" }}>Flat card</strong>
            <p style={{ font: "400 0.8125rem/1.5 var(--font-sans)", color: "var(--ink-2)", margin: "6px 0 0" }}>
              For nesting inside other cards, where a shadow would stack.
            </p>
          </Card>
          <Card well>
            <strong style={{ font: "600 0.875rem/1.3 var(--font-sans)" }}>Well</strong>
            <p style={{ font: "400 0.8125rem/1.5 var(--font-sans)", color: "var(--ink-2)", margin: "6px 0 0" }}>
              Recessed surface for secondary or preformatted content.
            </p>
          </Card>
        </div>
      ),
    },
    {
      title: "Key-value grid",
      render: () => (
        <Card style={{ maxWidth: 440 }}>
          <KeyValue
            rows={[
              ["Server", "copilot-money"],
              ["Transport", "stdio"],
              ["Tools", "38 available"],
              ["Auth", <Badge key="a" tone="moss" dot>OAuth · connected</Badge>],
              ["Last sync", "Today, 9:41 AM"],
            ]}
          />
        </Card>
      ),
    },
  ],
};

const feedback: Story = {
  id: "feedback",
  nav: "Feedback",
  group: "Primitives",
  title: "Feedback",
  lede: (
    <>
      Loading is honest: spinners for the unknown, progress for the known,
      skeletons for layout that's about to exist, toasts for what just happened.
    </>
  ),
  sections: [
    {
      title: "Spinner & progress",
      render: () => (
        <div className="sb-col" style={{ maxWidth: 380 }}>
          <div className="sb-row">
            <Spinner />
            <span style={{ font: "400 0.8125rem/1 var(--font-sans)", color: "var(--ink-2)" }}>
              Reading 214 transactions…
            </span>
          </div>
          <div>
            <span className="sb-spec-label">import — 68%</span>
            <ProgressBar value={68} />
          </div>
          <div>
            <span className="sb-spec-label">budget used — 45% (healthy)</span>
            <ProgressBar value={45} tone="moss" />
          </div>
        </div>
      ),
    },
    {
      title: "Skeletons",
      render: () => (
        <Card style={{ maxWidth: 420 }}>
          <div className="sb-col" style={{ gap: 10 }}>
            <div className="sb-row" style={{ gap: 10 }}>
              <Skeleton width={32} height={32} radius={99} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                <Skeleton width="55%" />
                <Skeleton width="35%" height={10} />
              </div>
            </div>
            <Skeleton height={10} />
            <Skeleton height={10} width="83%" />
          </div>
        </Card>
      ),
    },
    {
      title: "Toasts",
      render: () => (
        <div className="sb-col">
          <Toast tone="success">Budget saved</Toast>
          <Toast tone="error" action="Retry">
            Couldn't reach the server
          </Toast>
          <Toast action="Undo">3 transactions re-categorized</Toast>
        </div>
      ),
    },
  ],
};

const overlays: Story = {
  id: "overlays",
  nav: "Overlays",
  group: "Primitives",
  title: "Overlays",
  lede: (
    <>
      Tooltips answer "what is this," menus answer "what can I do," modals stop
      the world — so they're reserved for consequences.
    </>
  ),
  sections: [
    {
      title: "Tooltip & kbd",
      render: () => (
        <div className="sb-row" style={{ paddingTop: 36 }}>
          <Tooltip content="Re-run with the same arguments" open>
            <Button variant="secondary" icon="refresh">
              Re-run
            </Button>
          </Tooltip>
          <span style={{ font: "400 0.8125rem/1 var(--font-sans)", color: "var(--ink-2)", display: "inline-flex", gap: 6, alignItems: "center" }}>
            Send with <Kbd>⌘</Kbd>
            <Kbd>↵</Kbd>
          </span>
        </div>
      ),
    },
    {
      title: "Menu",
      render: () => (
        <Menu
          sections={[
            {
              label: "Transaction",
              items: [
                { label: "Edit details", icon: "pencil", kbd: "E" },
                { label: "Split…", icon: "branch" },
                { label: "Copy link", icon: "link" },
              ],
            },
            {
              items: [{ label: "Delete", icon: "trash", danger: true }],
            },
          ]}
        />
      ),
    },
    {
      title: "Modal",
      center: true,
      well: true,
      render: () => (
        <ModalExample title="Delete this rule?" confirmLabel="Delete rule" danger>
          Transactions already categorized by <strong>“Coffee → Dining out”</strong>{" "}
          keep their categories. New ones will land in your inbox for review
          instead.
        </ModalExample>
      ),
    },
    {
      title: "Empty state",
      render: () => (
        <Card pad={false} style={{ maxWidth: 480 }}>
          <EmptyState
            icon="inbox"
            title="Nothing needs review"
            hint="New transactions that can't be auto-categorized will wait for you here."
            action={<Button variant="secondary" size="sm">View all transactions</Button>}
          />
        </Card>
      ),
    },
  ],
};

/* ════════════════ Chat ════════════════ */

const messages: Story = {
  id: "messages",
  nav: "Messages",
  group: "Chat",
  title: "Messages",
  lede: (
    <>
      The core asymmetry: you speak in a tinted bubble on the right, the
      assistant answers as serif prose on the page. No avatar, no bubble — the
      typography is the identity.
    </>
  ),
  sections: [
    {
      title: "An exchange",
      well: true,
      render: () => (
        <div className="sb-col" style={{ maxWidth: 660, gap: 20 }}>
          <UserMessage>How did my spending look in June?</UserMessage>
          <AssistantMessage meta="Claude · 9:41 AM">
            <p>
              June came in at <strong>$4,286</strong>, about 8% under May. Dining
              out dropped the most — you cooked more after the 14th. One thing
              worth a look: you're paying for <em>two</em> music subscriptions.
            </p>
            <ul>
              <li>Spotify Premium — $11.99 on the 3rd</li>
              <li>Spotify Premium — $11.99 on the 21st</li>
            </ul>
            <p>
              Want me to flag the duplicate with <code>copilot-money</code>?
            </p>
          </AssistantMessage>
        </div>
      ),
    },
    {
      title: "Thinking & context markers",
      well: true,
      render: () => (
        <div className="sb-col" style={{ maxWidth: 660, gap: 20 }}>
          <ThinkingBlock summary="Thought for 12 seconds" defaultOpen>
            Two charges from the same merchant at the same amount within one
            cycle — likely a duplicate rather than a family plan, since both hit
            the same card.
          </ThinkingBlock>
          <ContextDivider>Earlier messages summarized</ContextDivider>
          <ThinkingBlock summary="Thought for 3 seconds" />
        </div>
      ),
    },
  ],
};

const toolcalls: Story = {
  id: "toolcalls",
  nav: "Tool calls",
  group: "Chat",
  title: "Tool call blocks",
  lede: (
    <>
      The seam between conversation and machinery. Collapsed, it's one calm line;
      open, it shows the request verbatim and renders the result as a real
      widget — not a JSON dump.
    </>
  ),
  sections: [
    {
      title: "The three states",
      render: () => (
        <div className="sb-col" style={{ maxWidth: 640 }}>
          <ToolCallBlock
            tool="get_spending_totals"
            server="copilot-money"
            status="running"
            defaultOpen={false}
          />
          <ToolCallBlock
            tool="get_spending_totals"
            server="copilot-money"
            status="success"
            duration="0.4s"
            defaultOpen={false}
          />
          <ToolCallBlock
            tool="create_transaction"
            server="copilot-money"
            status="error"
            defaultOpen={false}
          />
        </div>
      ),
    },
    {
      title: "Open, with request and rendered result",
      render: () => (
        <div style={{ maxWidth: 640 }}>
          <ToolCallBlock
            tool="get_spending_totals"
            server="copilot-money"
            status="success"
            duration="0.4s"
            icon="dollar"
            params={{ period: "2026-06", groupBy: "category" }}
          >
            <StatRow>
              <StatCard label="Total spent" value="$4,286" delta="8% vs May" direction="down" />
              <StatCard label="Top category" value="Groceries" delta="$918" direction="flat" />
              <StatCard label="Subscriptions" value="$142" delta="+$12" direction="up" />
            </StatRow>
          </ToolCallBlock>
        </div>
      ),
    },
    {
      title: "Failure is part of the design",
      note: "Errors say what happened and what to do — inside the same block.",
      render: () => (
        <div style={{ maxWidth: 640 }}>
          <ToolCallBlock
            tool="create_transaction"
            server="copilot-money"
            status="error"
            params={{ amount: -11.99, merchant: "Spotify", date: "2026-06-21" }}
          >
            <StatusBanner tone="error" title="Write actions are disabled">
              This deployment is read-only. Ask the workspace owner to enable
              write mode, or export the change as a CSV instead.
            </StatusBanner>
          </ToolCallBlock>
        </div>
      ),
    },
  ],
};

const codeblocks: Story = {
  id: "codeblocks",
  nav: "Code blocks",
  group: "Chat",
  title: "Code blocks",
  lede: (
    <>
      Machine text sits in a bordered well with a language bar and one-tap copy.
      Highlighting reuses the kit palette — terracotta keywords, moss strings.
    </>
  ),
  sections: [
    {
      title: "Sample",
      render: () => (
        <div style={{ maxWidth: 640 }}>
          <CodeBlock language="typescript">
            <Com>{"// Register a widget-returning MCP tool"}</Com>
            {"\n"}
            <Kw>const</Kw> server = <Kw>new</Kw> <Fn>McpServer</Fn>({"{"} name: <Str>"copilot-money"</Str> {"}"});
            {"\n\n"}
            server.<Fn>tool</Fn>(<Str>"get_spending_totals"</Str>, {"{"}
            {"\n"}  period: z.<Fn>string</Fn>(),
            {"\n"}{"}"}, <Kw>async</Kw> ({"{"} period {"}"}) {"=>"} ({"{"}
            {"\n"}  total: <Num>4286</Num>,
            {"\n"}  delta: <Num>-0.08</Num>,
            {"\n"}{"}"}));
          </CodeBlock>
        </div>
      ),
    },
  ],
};

const composer: Story = {
  id: "composer",
  nav: "Composer",
  group: "Chat",
  title: "Composer",
  lede: (
    <>
      The big soft input at the bottom of every chat. Attachments, a tool-count
      pill so people know what the assistant can reach, and one send button.
    </>
  ),
  sections: [
    {
      title: "Default & suggestions",
      well: true,
      render: () => (
        <div className="sb-col" style={{ maxWidth: 660, gap: 16 }}>
          <SuggestionChips
            items={["Summarize June", "Find duplicate charges", "Set a dining budget"]}
          />
          <ChatInput toolCount={38} />
        </div>
      ),
    },
    {
      title: "With a draft",
      well: true,
      render: () => (
        <div style={{ maxWidth: 660 }}>
          <ChatInput value="Cancel the duplicate Spotify subscription and " toolCount={38} />
        </div>
      ),
    },
  ],
};

/* ════════════════ Layout ════════════════ */

const collapsible: Story = {
  id: "collapsible",
  nav: "Collapsible views",
  group: "Layout",
  title: "Collapsible views",
  lede: (
    <>
      Progressive disclosure at three weights: an inline disclosure for a
      detail, an accordion for a set of sections, a collapsible card when the
      whole widget should fold away. All genuinely stateful — click them.
    </>
  ),
  sections: [
    {
      title: "Disclosure",
      note: "For raw payloads and fine print — closed by default.",
      render: () => (
        <Card style={{ maxWidth: 560 }}>
          <Disclosure label="Raw response" meta="2.1 KB · JSON" defaultOpen>
            <pre className="mcp-tool__params" style={{ padding: "4px 0 0" }}>
              {JSON.stringify(
                { total: 4286, currency: "USD", period: "2026-06", categories: 14 },
                null,
                2
              )}
            </pre>
          </Disclosure>
          <Disclosure label="Why this was flagged" meta="heuristic">
            Two charges from the same merchant at the same amount within one
            billing cycle, on the same card.
          </Disclosure>
          <Disclosure label="Permissions used" meta="read-only">
            This tool ran with <code>transactions:read</code> only. It cannot
            modify or delete anything.
          </Disclosure>
        </Card>
      ),
    },
    {
      title: "Accordion",
      note: "One frame, many sections. Set single to make sections exclusive.",
      render: () => (
        <div style={{ maxWidth: 560 }}>
          <Accordion
            defaultOpen={[0]}
            items={[
              {
                label: "copilot-money",
                icon: "dollar",
                meta: "38 tools",
                content: (
                  <div className="sb-col" style={{ gap: 10 }}>
                    <Switch label="Allow read tools without asking" defaultChecked />
                    <Switch label="Ask before every write action" defaultChecked />
                    <Switch label="Allow exports" />
                  </div>
                ),
              },
              {
                label: "linear",
                icon: "box",
                meta: "24 tools",
                content: "Connected via OAuth. Write actions always ask first.",
              },
              {
                label: "docs-cms",
                icon: "doc",
                meta: "11 tools",
                content: "Writes go to a branch and open a PR — never straight to main.",
              },
            ]}
          />
        </div>
      ),
    },
    {
      title: "Collapsible card",
      render: () => (
        <div style={{ maxWidth: 560 }}>
          <CollapsibleCard
            title="Request details"
            sub="get_spending_totals · 0.4s"
            icon="terminal"
            actions={<Badge tone="moss" dot>200</Badge>}
          >
            <KeyValue
              mono
              rows={[
                ["period", "2026-06"],
                ["compare", "2026-05"],
                ["groupBy", "category"],
                ["latency", "412ms"],
              ]}
            />
          </CollapsibleCard>
        </div>
      ),
    },
  ],
};

const splitview: Story = {
  id: "splitview",
  nav: "Split view",
  group: "Layout",
  title: "Split view",
  lede: (
    <>
      Master–detail in one widget: a list on one side, the selected thing on
      the other. The divider actually drags — pointer-based, so it works with
      touch — and nudges with arrow keys when focused.
    </>
  ),
  sections: [
    {
      title: "Files & preview",
      note: "Drag the handle between the panes.",
      render: () => (
        <SplitView
          initial={42}
          height={330}
          left={
            <ListManager flat>
              <ListRow
                icon="doc"
                title="token-lifecycle.md"
                subtitle="4 matches"
                end={<Badge tone="crail">Selected</Badge>}
              />
              <ListRow icon="doc" title="oauth-scopes.md" subtitle="2 matches" />
              <ListRow icon="doc" title="faq.md" subtitle="1 match" />
              <ListRow icon="folder" title="guides/" subtitle="12 files" />
            </ListManager>
          }
          right={
            <div style={{ padding: 18 }}>
              <span className="sb-eyebrow" style={{ marginBottom: 8 }}>
                docs/auth · preview
              </span>
              <h3 style={{ font: "600 1.15rem/1.3 var(--font-serif)", margin: "6px 0 8px" }}>
                Token lifecycle
              </h3>
              <p style={{ font: "400 0.85rem/1.6 var(--font-sans)", color: "var(--ink-2)", margin: 0 }}>
                Access tokens are issued per session and expire{" "}
                <mark style={{ background: "var(--amber-soft)", color: "var(--amber)", padding: "1px 4px", borderRadius: 4 }}>
                  30 days
                </mark>{" "}
                after issue. Refresh tokens last one year and can be revoked at
                any time from the dashboard.
              </p>
            </div>
          }
        />
      ),
    },
  ],
};

/* Live demos need their own state, so they're tiny components. */

function SheetDemo() {
  const [side, setSide] = useState<null | "right" | "bottom">(null);
  return (
    <>
      <div className="sb-row">
        <Button variant="secondary" icon="chevronRight" onClick={() => setSide("right")}>
          Open side sheet
        </Button>
        <Button variant="secondary" icon="chevronUp" onClick={() => setSide("bottom")}>
          Open bottom sheet
        </Button>
      </div>
      <Sheet
        open={side !== null}
        onClose={() => setSide(null)}
        side={side ?? "right"}
        title="Erewhon Market"
        sub="Jun 28 · Groceries · Amex ••• 3007"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSide(null)}>
              Close
            </Button>
            <Button variant="primary">Save changes</Button>
          </>
        }
      >
        <div className="sb-col" style={{ gap: 16 }}>
          <StatRow>
            <StatCard label="Amount" value="−$84.20" />
            <StatCard label="This month here" value="$312" delta="4 visits" direction="flat" />
          </StatRow>
          <Field label="Category">
            <Select options={["Groceries", "Dining out", "Household"]} defaultValue="Groceries" />
          </Field>
          <Field label="Note">
            <Input placeholder="Add a note for your future self…" />
          </Field>
          <Checkbox label="Always categorize this merchant as Groceries" defaultChecked />
        </div>
      </Sheet>
    </>
  );
}

function FullscreenDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" icon="expand" onClick={() => setOpen(true)}>
        Open full screen
      </Button>
      <Fullscreen
        open={open}
        onClose={() => setOpen(false)}
        icon="dollar"
        title="June 2026 — spending report"
        sub="copilot-money · get_spending_totals"
        wide
        actions={
          <>
            <Segmented options={[{ label: "Month" }, { label: "Quarter" }, { label: "Year" }]} />
            <Button variant="secondary" size="sm" icon="download">
              Export
            </Button>
          </>
        }
      >
        <StatRow>
          <StatCard label="Total spent" value="$4,286" delta="8% vs May" direction="down" />
          <StatCard label="Income" value="$9,700" delta="unchanged" direction="flat" />
          <StatCard label="Saved" value="$5,414" delta="+$610" direction="up" />
          <StatCard label="Subscriptions" value="$142" delta="+$12" direction="up" />
        </StatRow>
        <div className="sb-grid-2">
          <BarChart
            title="Six-month trend"
            data={[
              { label: "Jan", value: 4980 },
              { label: "Feb", value: 4420 },
              { label: "Mar", value: 5210 },
              { label: "Apr", value: 4660 },
              { label: "May", value: 4655 },
              { label: "Jun", value: 4286 },
            ]}
            highlight={5}
          />
          <DonutChart
            title="By category"
            centerValue="$4,286"
            centerLabel="total"
            segments={[
              { label: "Groceries", value: 918, color: "var(--crail)" },
              { label: "Rent", value: 2100, color: "var(--ink-3)" },
              { label: "Dining out", value: 486, color: "var(--amber)" },
              { label: "Other", value: 782, color: "var(--paper-3)" },
            ]}
          />
        </div>
        <DataTable
          columns={[
            { header: "Date", sorted: "desc" },
            { header: "Merchant" },
            { header: "Category" },
            { header: "Amount", numeric: true },
          ]}
          rows={[
            ["Jun 28", "Erewhon Market", <Badge key="1">Groceries</Badge>, "−$84.20"],
            ["Jun 27", "Spotify", <Badge key="2" tone="amber" dot>Duplicate?</Badge>, "−$11.99"],
            ["Jun 27", "Caltrain", <Badge key="3">Transport</Badge>, "−$7.50"],
            ["Jun 26", "Sightglass Coffee", <Badge key="4">Dining out</Badge>, "−$6.75"],
          ]}
          footer={{ summary: "Showing 4 of 128 · June 2026" }}
        />
      </Fullscreen>
    </>
  );
}

const takeovers: Story = {
  id: "takeovers",
  nav: "Sheets & Fullscreen",
  group: "Layout",
  title: "Sheets & fullscreen",
  lede: (
    <>
      When a widget outgrows the conversation: sheets keep the chat visible for
      quick edits; a fullscreen takeover commits the whole viewport to one
      interaction. Both are live here — Escape closes them.
    </>
  ),
  sections: [
    {
      title: "Sheets",
      note: "Side sheet for detail-and-edit; bottom sheet reads better on phones.",
      render: () => <SheetDemo />,
    },
    {
      title: "Fullscreen takeover",
      note: "Header keeps the tool's identity, actions, and an exit — content gets the rest.",
      render: () => <FullscreenDemo />,
    },
    {
      title: "Expandable — any widget, one affordance",
      note: "Hover the chart: the corner button opens the same component full screen.",
      render: () => (
        <div style={{ maxWidth: 480 }}>
          <Expandable title="Six-month trend" sub="copilot-money · live view" icon="chart">
            <BarChart
              title="Six-month trend"
              subtitle="hover me"
              data={[
                { label: "Jan", value: 4980 },
                { label: "Feb", value: 4420 },
                { label: "Mar", value: 5210 },
                { label: "Apr", value: 4660 },
                { label: "May", value: 4655 },
                { label: "Jun", value: 4286 },
              ]}
              highlight={5}
            />
          </Expandable>
        </div>
      ),
    },
  ],
};

/* ════════════════ Widgets ════════════════ */

const stats: Story = {
  id: "stats",
  nav: "Stats & Charts",
  group: "Tool widgets",
  title: "Stats & charts",
  lede: (
    <>
      Numbers a tool returned, made glanceable. Serif numerals give values the
      same voice as the assistant; charts are pure SVG in kit colors, no
      libraries.
    </>
  ),
  sections: [
    {
      title: "Stat cards",
      render: () => (
        <StatRow>
          <StatCard label="Net worth" value="$182,430" delta="+2.1% this month" direction="up" />
          <StatCard label="June spend" value="$4,286" delta="8% vs May" direction="down" />
          <StatCard label="Open issues" value="47" delta="12 this week" direction="up" />
          <StatCard label="Uptime" value="99.98%" delta="30 days" direction="flat" />
        </StatRow>
      ),
    },
    {
      title: "Bar & line",
      render: () => (
        <div className="sb-grid-2">
          <BarChart
            title="Spending by month"
            subtitle="Jan – Jun 2026"
            data={[
              { label: "Jan", value: 4980 },
              { label: "Feb", value: 4420 },
              { label: "Mar", value: 5210 },
              { label: "Apr", value: 4660 },
              { label: "May", value: 4655 },
              { label: "Jun", value: 4286 },
            ]}
            highlight={5}
          />
          <LineChart
            title="Daily balance"
            subtitle="June, vs May (dashed)"
            points={[62, 58, 61, 55, 52, 57, 54, 49, 53, 50, 47, 52, 55, 51, 58, 61, 57, 63]}
            compare={[55, 54, 51, 53, 49, 47, 50, 46, 48, 45, 47, 44, 48, 46, 49, 47, 51, 49]}
          />
        </div>
      ),
    },
    {
      title: "Donut",
      render: () => (
        <div style={{ maxWidth: 420 }}>
          <DonutChart
            title="June by category"
            centerValue="$4,286"
            centerLabel="total"
            segments={[
              { label: "Groceries", value: 918, color: "var(--crail)" },
              { label: "Rent", value: 2100, color: "var(--ink-3)" },
              { label: "Dining out", value: 486, color: "var(--amber)" },
              { label: "Everything else", value: 782, color: "var(--paper-3)" },
            ]}
          />
        </div>
      ),
    },
  ],
};

const tables: Story = {
  id: "tables",
  nav: "Data table",
  group: "Tool widgets",
  title: "Data table",
  lede: (
    <>
      The workhorse for list-shaped tool results. Uppercase micro-headers,
      tabular numerals right-aligned, and a footer that owns pagination and
      caveats.
    </>
  ),
  sections: [
    {
      title: "Transactions",
      render: () => (
        <DataTable
          columns={[
            { header: "Date", sorted: "desc" },
            { header: "Merchant" },
            { header: "Category" },
            { header: "Amount", numeric: true },
          ]}
          rows={[
            ["Jun 28", "Erewhon Market", <Badge key="1">Groceries</Badge>, "−$84.20"],
            ["Jun 27", "Spotify", <Badge key="2" tone="amber" dot>Duplicate?</Badge>, "−$11.99"],
            ["Jun 27", "Caltrain", <Badge key="3">Transport</Badge>, "−$7.50"],
            ["Jun 26", "Sightglass Coffee", <Badge key="4">Dining out</Badge>, "−$6.75"],
            ["Jun 25", "Payroll · Acme Co", <Badge key="5" tone="moss">Income</Badge>, <strong key="v">+$4,850.00</strong>],
          ]}
          footer={{
            summary: "Showing 5 of 128 · June 2026",
            action: (
              <Button variant="ghost" size="sm" iconAfter="arrowRight">
                Next
              </Button>
            ),
          }}
        />
      ),
    },
  ],
};

const lists: Story = {
  id: "lists",
  nav: "List manager",
  group: "Tool widgets",
  title: "List manager",
  lede: (
    <>
      Rows with a glyph, a two-line identity, and trailing actions — for when a
      tool result is a set of things to act on, not data to read.
    </>
  ),
  sections: [
    {
      title: "Recurring charges",
      render: () => (
        <div style={{ maxWidth: 640 }}>
          <ListManager>
            <ListRow
              icon="music"
              title="Spotify Premium"
              subtitle="$11.99 · monthly · next on Jul 3"
              end={
                <>
                  <Badge tone="amber" dot>
                    Duplicate
                  </Badge>
                  <IconButton icon="dots" label="More" size="sm" />
                </>
              }
            />
            <ListRow
              icon="globe"
              title="Fastmail"
              subtitle="$5.00 · monthly · next on Jul 11"
              end={<IconButton icon="dots" label="More" size="sm" />}
            />
            <ListRow
              icon="server"
              title="Hetzner Cloud"
              subtitle="$26.40 · monthly · next on Jul 14"
              end={
                <>
                  <Badge tone="moss" dot>
                    Business
                  </Badge>
                  <IconButton icon="dots" label="More" size="sm" />
                </>
              }
            />
          </ListManager>
        </div>
      ),
    },
  ],
};

const files: Story = {
  id: "files",
  nav: "Files & Media",
  group: "Tool widgets",
  title: "Files & media",
  lede: (
    <>
      Anything a tool hands back that opens elsewhere: documents, exports,
      artwork. File cards stay compact; media cards earn their art area.
    </>
  ),
  sections: [
    {
      title: "File cards",
      render: () => (
        <FileGrid>
          <FileCard name="june-spending.csv" meta="12 KB · 128 rows" icon="table" />
          <FileCard name="Q2 budget review.pdf" meta="1.4 MB · 9 pages" icon="doc" tone="denim" />
          <FileCard name="receipts/" meta="34 files · updated today" icon="folder" tone="moss" />
        </FileGrid>
      ),
    },
    {
      title: "Media cards",
      render: () => (
        <div className="sb-grid-2" style={{ maxWidth: 640 }}>
          <MediaCard
            title="hero-concept-v3.png"
            meta="1920 × 1080 · generated 2h ago"
            badge="PNG"
          />
          <MediaCard
            title="walkthrough.mp4"
            meta="2:14 · 18 MB"
            icon="play"
            badge="Video"
            gradient="linear-gradient(135deg, #52709a, #2e4668)"
          />
        </div>
      ),
    },
  ],
};

const approvals: Story = {
  id: "approvals",
  nav: "Confirmation",
  group: "Tool widgets",
  title: "Confirmation cards",
  lede: (
    <>
      The trust boundary of every MCP tool: nothing writes without a human
      pressing the terracotta button. Show exactly what will happen, in the
      user's terms — then show that it happened.
    </>
  ),
  sections: [
    {
      title: "Awaiting approval",
      render: () => (
        <div style={{ maxWidth: 560 }}>
          <ConfirmationCard
            title="Cancel Spotify Premium (duplicate)"
            subtitle="copilot-money wants to edit a recurring charge"
            details={[
              ["Action", "Mark recurring as canceled"],
              ["Charge", "Spotify Premium — $11.99/mo"],
              ["Keeps", "Your original subscription from 2019"],
              ["Effective", "Before the Jul 3 renewal"],
            ]}
          />
        </div>
      ),
    },
    {
      title: "Resolved",
      render: () => (
        <div style={{ maxWidth: 560 }}>
          <ConfirmationCard
            title="Canceled duplicate subscription"
            resolved
            resolvedLabel="Approved · 9:44 AM"
            details={[
              ["Charge", "Spotify Premium — $11.99/mo"],
              ["Saves", "$143.88 / year"],
            ]}
          />
        </div>
      ),
    },
  ],
};

const elicitation: Story = {
  id: "elicitation",
  nav: "Elicitation",
  group: "Tool widgets",
  title: "Elicitation",
  lede: (
    <>
      When the tool needs an answer before it can continue, options become
      cards — scannable, tappable, with the trade-off written on each one.
    </>
  ),
  sections: [
    {
      title: "Single choice",
      render: () => (
        <div style={{ maxWidth: 620 }}>
          <ElicitationCard
            question="Which Spotify charge should stay?"
            selected={0}
            options={[
              {
                title: "Keep the original",
                description: "Active since 2019, tied to your family plan.",
              },
              {
                title: "Keep the newer one",
                description: "Started Jun 21 — likely created by mistake.",
              },
              {
                title: "Keep both",
                description: "Do nothing; stop flagging this as a duplicate.",
              },
            ]}
          />
        </div>
      ),
    },
    {
      title: "Form follow-up",
      render: () => (
        <Card style={{ maxWidth: 480 }}>
          <div className="sb-col" style={{ gap: 14 }}>
            <Field label="Set a subscriptions budget" hint="You'll be notified at 80%.">
              <Input defaultValue="$120 / month" />
            </Field>
            <div className="sb-row" style={{ justifyContent: "flex-end" }}>
              <Button variant="ghost" size="sm">
                Skip
              </Button>
              <Button variant="primary" size="sm">
                Save budget
              </Button>
            </div>
          </div>
        </Card>
      ),
    },
  ],
};

const progress: Story = {
  id: "progress",
  nav: "Progress & Tasks",
  group: "Tool widgets",
  title: "Progress & tasks",
  lede: (
    <>
      Long-running tool work narrated as steps, and checklists for work the
      human and assistant share. The pulsing dot means "now."
    </>
  ),
  sections: [
    {
      title: "Progress tracker",
      render: () => (
        <Card style={{ maxWidth: 480 }}>
          <ProgressTracker
            steps={[
              { title: "Fetched 128 transactions", sub: "copilot-money · 0.4s", state: "done" },
              { title: "Matched recurring charges", sub: "12 subscriptions found", state: "done" },
              { title: "Scanning for duplicates", sub: "comparing merchants & amounts…", state: "active" },
              { title: "Draft summary", state: "pending" },
            ]}
          />
        </Card>
      ),
    },
    {
      title: "Checklist",
      render: () => (
        <Card style={{ maxWidth: 480 }}>
          <TaskChecklist
            items={[
              { label: "Review June transactions", done: true },
              { label: "Cancel duplicate subscription", done: true },
              { label: "Set subscriptions budget", done: false },
              { label: "Export report for accountant", done: false },
            ]}
          />
        </Card>
      ),
    },
  ],
};

const logsdiffs: Story = {
  id: "logs",
  nav: "Logs & Diffs",
  group: "Tool widgets",
  title: "Logs & diffs",
  lede: (
    <>
      For developer-facing tools: a dark terminal well that stays dark in both
      themes, and a diff that shows exactly what a write action will change
      before it's approved.
    </>
  ),
  sections: [
    {
      title: "Log viewer",
      render: () => (
        <div style={{ maxWidth: 640 }}>
          <LogViewer
            title="mcp-server · stdio"
            lines={[
              { time: "09:41:02", text: "connected · protocol 2025-11-25" },
              { time: "09:41:02", text: "38 tools registered", level: "ok" },
              { time: "09:41:18", text: "call get_spending_totals { period: '2026-06' }" },
              { time: "09:41:18", text: "← 200 · 412ms", level: "ok" },
              { time: "09:41:34", text: "call create_transaction …", },
              { time: "09:41:34", text: "← rejected: WRITE_MODE=disabled", level: "warn" },
              { time: "09:41:51", text: "retry without write flag failed", level: "err" },
            ]}
          />
        </div>
      ),
    },
    {
      title: "Diff view",
      render: () => (
        <div style={{ maxWidth: 640 }}>
          <DiffView
            file="budgets/2026-07.yaml"
            additions={2}
            deletions={1}
            lines={[
              { kind: "hunk", text: "@@ budgets @@" },
              { kind: "ctx", text: "dining_out: 450" },
              { kind: "del", text: "subscriptions: 160" },
              { kind: "add", text: "subscriptions: 120" },
              { kind: "add", text: "subscriptions_alert: 0.8" },
              { kind: "ctx", text: "transport: 90" },
            ]}
          />
        </div>
      ),
    },
  ],
};

const timelines: Story = {
  id: "timeline",
  nav: "Timeline & Entities",
  group: "Tool widgets",
  title: "Timeline & entities",
  lede: (
    <>
      A timeline for "what happened," an entity card for "who or what this is."
      Together they cover most record-shaped tool results.
    </>
  ),
  sections: [
    {
      title: "Timeline",
      render: () => (
        <Card style={{ maxWidth: 520 }}>
          <Timeline
            items={[
              { title: "Duplicate flagged", time: "9:42 AM", body: "Two Spotify charges matched within one cycle.", accent: true },
              { title: "Approval requested", time: "9:43 AM" },
              { title: "Recurring canceled", time: "9:44 AM", body: "Effective before the Jul 3 renewal." },
              { title: "Budget updated", time: "9:45 AM", body: "Subscriptions: $160 → $120 / month." },
            ]}
          />
        </Card>
      ),
    },
    {
      title: "Entity card",
      render: () => (
        <div style={{ maxWidth: 460 }}>
          <EntityCard
            name="Spotify Premium"
            subtitle="Recurring charge · Entertainment"
            initials="SP"
            badge="Canceled"
            badgeTone="moss"
            fields={[
              ["Amount", "$11.99 / month"],
              ["First seen", "Jun 21, 2026"],
              ["Payment method", "Amex ••• 3007"],
              ["Yearly total", "$143.88"],
            ]}
            actions={
              <>
                <Button variant="secondary" size="sm" icon="refresh">
                  Reactivate
                </Button>
                <Button variant="ghost" size="sm" iconAfter="external">
                  View in Copilot
                </Button>
              </>
            }
          />
        </div>
      ),
    },
  ],
};

/* ════════════════ Registry ════════════════ */

export const STORIES: Story[] = [
  colors,
  typography,
  icons,
  buttons,
  badges,
  inputs,
  selection,
  tabs,
  surfaces,
  feedback,
  overlays,
  messages,
  toolcalls,
  codeblocks,
  composer,
  collapsible,
  splitview,
  takeovers,
  stats,
  tables,
  lists,
  files,
  approvals,
  elicitation,
  progress,
  logsdiffs,
  timelines,
];
