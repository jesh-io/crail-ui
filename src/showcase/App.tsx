import { useEffect, useMemo, useState } from "react";
import {
  Icon,
  IconButton,
  UserMessage,
  AssistantMessage,
  ToolCallBlock,
  CodeBlock,
  StatRow,
  StatCard,
  BarChart,
  StatusBanner,
  Button,
  type IconName,
} from "../kit";
import { STORIES, type Story } from "./stories";
import { SCENARIOS, ScenarioStage, type Scenario } from "./scenarios";

/* ── Tiny hash router ────────────────────────────────────────── */

function useRoute(): [string, (r: string) => void] {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || "home");
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.slice(1) || "home");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return [route, (r: string) => (window.location.hash = r)];
}

/* ── Theme: follows the browser until the person chooses ─────── */

const THEME_KEY = "crail-theme";

function useTheme(): ["light" | "dark", (t: "light" | "dark") => void] {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // With no explicit choice saved, track the browser preference live.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(THEME_KEY)) setTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const choose = (t: "light" | "dark") => {
    localStorage.setItem(THEME_KEY, t);
    setTheme(t);
  };
  return [theme, choose];
}

const GITHUB_URL = "https://github.com/jesh-io/crail-ui";

/* ── Nav data ────────────────────────────────────────────────── */

const GROUP_ORDER = ["Foundations", "Primitives", "Layout", "Data", "Flows", "Chat"];
const GROUP_ICONS: Record<string, IconName> = {
  Foundations: "box",
  Primitives: "sliders",
  Layout: "columns",
  Data: "chart",
  Flows: "check",
  Chat: "spark",
};

function ThemeToggle({
  theme,
  onChoose,
}: {
  theme: "light" | "dark";
  onChoose: (t: "light" | "dark") => void;
}) {
  return (
    <IconButton
      icon={theme === "light" ? "moon" : "sun"}
      label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      size="sm"
      onClick={() => onChoose(theme === "light" ? "dark" : "light")}
    />
  );
}

function GitHubMark({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function GitHubLink() {
  return (
    <a
      className="sb-gh-link"
      href={GITHUB_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Crail on GitHub"
    >
      <GitHubMark />
      GitHub
    </a>
  );
}

function InstallLine() {
  const [copied, setCopied] = useState(false);
  const cmd = "npm install crail-ui";
  return (
    <button
      className="sb-install"
      title="Copy to clipboard"
      onClick={() => {
        navigator.clipboard.writeText(cmd).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
    >
      <span className="sb-install__prompt">$</span>
      <code>{cmd}</code>
      <Icon name={copied ? "check" : "copy"} size={13} />
    </button>
  );
}

function Brand({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="sb-brand"
      onClick={onClick}
      style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
    >
      <span className="sb-brand__mark">
        <Icon name="spark" size={16} strokeWidth={2} />
      </span>
      <span>
        <div className="sb-brand__name">Crail</div>
        <div className="sb-brand__sub">Live UI for Claude</div>
      </span>
    </button>
  );
}

/* Sidebar links that point INTO the landing page — the visitor's journey
   (what is it → see it work → wire it up), not the kit's internal anatomy. */
function goSection(go: (r: string) => void, id: string) {
  const onHome = (window.location.hash.slice(1) || "home") === "home";
  if (!onHome) go("home");
  // Deferred past the click (focus scroll wins otherwise) and instant:
  // smooth scrolls get cancelled by the sticky-sidebar layout.
  setTimeout(
    () => document.getElementById(id)?.scrollIntoView({ block: "start" }),
    onHome ? 60 : 200,
  );
}

const START_LINKS: Array<{ id: string; label: string; icon: IconName }> = [
  { id: "how-it-works", label: "How it works", icon: "play" },
  { id: "tools", label: "The tools", icon: "wrench" },
  { id: "connect", label: "Connect it", icon: "link" },
];

const GROUP_LABELS: Record<string, string> = {
  Foundations: "Foundations",
  Primitives: "Primitives",
  Layout: "Layout",
  Data: "Data & content",
  Flows: "Flows & status",
  Chat: "Chat chrome",
};

function NavSections({
  activeStory,
  activeScenario,
  onGo,
}: {
  activeStory?: Story;
  activeScenario?: Scenario;
  onGo: (r: string) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, Story[]>();
    for (const g of GROUP_ORDER) map.set(g, []);
    for (const s of STORIES) map.get(s.group)?.push(s);
    return map;
  }, []);

  // Accordion library: only the group you're in stays open.
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(activeStory ? [activeStory.group] : []),
  );
  useEffect(() => {
    if (activeStory) setOpenGroups(new Set([activeStory.group]));
  }, [activeStory]);
  const toggleGroup = (g: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });

  const [filter, setFilter] = useState("");
  const q = filter.trim().toLowerCase();
  const matches = q ? STORIES.filter((s) => s.nav.toLowerCase().includes(q)) : [];

  const onHome = !activeStory && !activeScenario;

  const storyButton = (s: Story) => (
    <button
      key={s.id}
      className={`sb-nav-item ${activeStory?.id === s.id ? "sb-nav-item--active" : ""}`}
      onClick={() => onGo(`story/${s.id}`)}
    >
      <Icon name={GROUP_ICONS[s.group]} size={13} />
      {s.nav}
    </button>
  );

  return (
    <>
      {/* The visitor's path: what is it → see it work → the parts list. */}
      <div>
        <div className="sb-nav-group">Start</div>
        <button
          className={`sb-nav-item ${onHome ? "sb-nav-item--active" : ""}`}
          onClick={() => onGo("home")}
        >
          <Icon name="home" size={13} />
          Overview
        </button>
        {START_LINKS.map((l) => (
          <button key={l.id} className="sb-nav-item" onClick={() => goSection(onGo, l.id)}>
            <Icon name={l.icon} size={13} />
            {l.label}
          </button>
        ))}
      </div>

      {/* See it working before the parts bin. */}
      <div>
        <div className="sb-nav-group">Examples</div>
        {SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            className={`sb-nav-item ${
              activeScenario?.id === sc.id ? "sb-nav-item--active" : ""
            }`}
            onClick={() => onGo(`scenario/${sc.id}`)}
          >
            <Icon name="play" size={13} />
            {sc.nav}
          </button>
        ))}
      </div>

      {/* The library: everything Claude composes with. */}
      <div className="sb-nav-banner">Component library</div>
      <div className="sb-filter">
        <Icon name="search" size={12} />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter components…"
          aria-label="Filter components"
        />
        {filter && (
          <button className="sb-filter__clear" aria-label="Clear filter" onClick={() => setFilter("")}>
            <Icon name="x" size={11} />
          </button>
        )}
      </div>
      {q ? (
        <div>
          {matches.length ? (
            matches.map(storyButton)
          ) : (
            <div className="sb-filter__none">Nothing matches "{filter.trim()}"</div>
          )}
        </div>
      ) : (
        [...grouped.entries()].map(([group, stories]) => {
          const open = openGroups.has(group);
          return (
            <div key={group}>
              <button
                className="sb-nav-groupbtn"
                onClick={() => toggleGroup(group)}
                aria-expanded={open}
              >
                <Icon name="chevronRight" size={11} className={`sb-nav-chev ${open ? "is-open" : ""}`} />
                {GROUP_LABELS[group] ?? group}
                <span className="sb-nav-count">{stories.length}</span>
              </button>
              {open && stories.map(storyButton)}
            </div>
          );
        })
      )}
    </>
  );
}

/* ── Pages ───────────────────────────────────────────────────── */

function StoryPage({ story }: { story: Story }) {
  return (
    <div key={story.id}>
      <div className="sb-page-head">
        <span className="sb-eyebrow">
          {story.group} · {story.nav}
        </span>
        <h1 className="sb-title">{story.title}</h1>
        <p className="sb-lede">{story.lede}</p>
      </div>
      {story.sections.map((s) => (
        <section className="sb-section" key={s.title}>
          <div className="sb-section__head">
            <span className="sb-section__title">{s.title}</span>
            {s.note && <span className="sb-section__note">{s.note}</span>}
          </div>
          <div
            className={[
              "sb-canvas",
              s.well && "sb-canvas--well",
              s.center && "sb-canvas--center",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {s.render()}
          </div>
        </section>
      ))}
    </div>
  );
}

function ScenarioPage({ scenario }: { scenario: Scenario }) {
  const [inspect, setInspect] = useState(false);
  return (
    <div key={scenario.id}>
      <div className="sb-page-head">
        <span className="sb-eyebrow">Scenario · {scenario.nav}</span>
        <h1 className="sb-title">{scenario.title}</h1>
        <p className="sb-lede">{scenario.lede}</p>
      </div>
      <div className="sb-scenario-tools">
        <button
          className={`sb-inspect-toggle ${inspect ? "sb-inspect-toggle--on" : ""}`}
          onClick={() => setInspect(!inspect)}
          aria-pressed={inspect}
        >
          <Icon name="eye" size={13} />
          {inspect ? "Inspecting components" : "Inspect components"}
        </button>
        <span className="sb-scenario-note">
          {inspect
            ? "Every outlined region is one kit component."
            : "Toggle to outline and name each kit component in place."}
        </span>
      </div>
      <ScenarioStage scenario={scenario} inspect={inspect} />
    </div>
  );
}

/* ── The live demo the landing revolves around ────────────────── */

const DEMO_SOURCE = `function App() {
  const [ok, setOk] = useState(false);
  return <>
    <StatRow>
      <StatCard label="Total spent" value="$4,286"
                delta="8% vs May" direction="down" />
      <StatCard label="Saved" value="$5,414"
                delta="+$610" direction="up" />
    </StatRow>
    <BarChart title="June by category"
              data={data.categories} />
    {ok
      ? <StatusBanner tone="success" title="Budget confirmed" />
      : <Button variant="primary"
          onClick={() => { setOk(true); report("user confirmed budget"); }}>
          Confirm budget
        </Button>}
  </>;
}`;

const DEMO_DATA = [
  { label: "Rent", value: 2200 },
  { label: "Food", value: 840 },
  { label: "Transport", value: 320 },
  { label: "Fun", value: 510 },
  { label: "Other", value: 416 },
];

function DemoWidget({ onEvent }: { onEvent: () => void }) {
  const [ok, setOk] = useState(false);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <StatRow>
        <StatCard label="Total spent" value="$4,286" delta="8% vs May" direction="down" />
        <StatCard label="Saved" value="$5,414" delta="+$610" direction="up" />
      </StatRow>
      <BarChart title="June by category" data={DEMO_DATA} />
      {ok ? (
        <StatusBanner tone="success" title="Budget confirmed">
          The widget just called <code>report("user confirmed budget")</code> — Claude hears
          about it without a single token of chat.
        </StatusBanner>
      ) : (
        <Button
          variant="primary"
          onClick={() => {
            setOk(true);
            onEvent();
          }}
        >
          Confirm budget
        </Button>
      )}
    </div>
  );
}

function EndpointLine() {
  const [copied, setCopied] = useState(false);
  const url = "https://crail.jesh.dev/mcp";
  return (
    <button
      className="sb-install"
      title="Copy the MCP endpoint"
      onClick={() => {
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
    >
      <Icon name="spark" size={13} />
      <code>{url}</code>
      <Icon name={copied ? "check" : "copy"} size={13} />
    </button>
  );
}

function HomePage({ go }: { go: (r: string) => void }) {
  const [eventFired, setEventFired] = useState(false);
  const counts = useMemo(() => {
    const byGroup: Record<string, number> = {};
    for (const s of STORIES) byGroup[s.group] = (byGroup[s.group] ?? 0) + 1;
    return byGroup;
  }, []);
  return (
    <div>
      <div className="sb-hero">
        <span className="sb-eyebrow">Crail · generative UI for Claude, over MCP</span>
        <h1 className="sb-hero__title">
          Claude composes <em>live UI</em>, right in the chat.
        </h1>
        <p className="sb-lede" style={{ maxWidth: 660 }}>
          Plug one MCP endpoint into Claude and any tool result can become a
          real, interactive widget — composed on the fly from this kit, in
          Claude's own design language. No build step, no imports, no iframe
          hosting of your own: Claude writes a few lines of JSX, the Crail
          playground renders them inline, and user interactions flow silently
          back to the model.
        </p>
        <div className="sb-hero__actions">
          <EndpointLine />
          <InstallLine />
          <a className="sb-gh-btn" href={GITHUB_URL} target="_blank" rel="noreferrer">
            <GitHubMark />
            View on GitHub
          </a>
        </div>
      </div>

      <section className="sb-section" id="how-it-works">
        <div className="sb-section__head">
          <span className="sb-section__title">How it works</span>
          <span className="sb-section__note">
            This demo is live — the widget on the right is running, click it.
          </span>
        </div>

        <div className="sb-steps">
          <div className="sb-step">
            <span className="sb-step__n">1</span>
            <span className="sb-step__title">Connect</span>
            <span className="sb-step__desc">
              Add the endpoint as a custom connector in Claude — nothing to
              install, nothing to host.
            </span>
          </div>
          <div className="sb-step">
            <span className="sb-step__n">2</span>
            <span className="sb-step__title">Discover</span>
            <span className="sb-step__desc">
              Claude calls <code>list_components</code> and{" "}
              <code>get_component</code> for real prop signatures — ~70
              components, generated from the kit's types.
            </span>
          </div>
          <div className="sb-step">
            <span className="sb-step__n">3</span>
            <span className="sb-step__title">Compose</span>
            <span className="sb-step__desc">
              Claude sends plain JSX to <code>render_ui</code>. Every component
              is already in scope; data rides along as JSON.
            </span>
          </div>
          <div className="sb-step">
            <span className="sb-step__n">4</span>
            <span className="sb-step__title">Interact</span>
            <span className="sb-step__desc">
              The playground renders it inline. Clicks, state, and console
              output report back to Claude — it iterates on what it hears.
            </span>
          </div>
        </div>

        <UserMessage>How did June spending look? Give me something I can act on.</UserMessage>
        <div style={{ height: 14 }} />
        <div className="sb-duo">
          <div>
            <div className="sb-section__note" style={{ display: "block", marginBottom: 8 }}>
              The JSX Claude writes — no imports, hooks allowed, <code>data</code> in scope:
            </div>
            <CodeBlock language="jsx">{DEMO_SOURCE}</CodeBlock>
          </div>
          <div>
            <div className="sb-section__note" style={{ display: "block", marginBottom: 8 }}>
              What renders in the conversation:
            </div>
            <AssistantMessage>
              <ToolCallBlock
                tool="render_ui"
                server="crail"
                status="success"
                duration="0.2s"
                params={{ title: "June budget", data: "{ categories: […] }" }}
              >
                <DemoWidget onEvent={() => setEventFired(true)} />
              </ToolCallBlock>
            </AssistantMessage>
            <div style={{ height: 10 }} />
            <div className={`sb-event ${eventFired ? "" : "sb-event--idle"}`}>
              <Icon name={eventFired ? "check" : "clock"} size={13} />
              {eventFired
                ? '[event] user confirmed budget → delivered to Claude via updateModelContext'
                : "waiting for you to click the widget…"}
            </div>
          </div>
        </div>
      </section>

      <section className="sb-section" id="tools">
        <div className="sb-section__head">
          <span className="sb-section__title">Three tools, one playground</span>
          <span className="sb-section__note">
            The whole server surface — stateless, no auth, plug in and go.
          </span>
        </div>
        <div className="sb-home-cards" style={{ marginTop: 0 }}>
          <div className="sb-home-card" style={{ cursor: "default" }}>
            <span className="sb-home-card__icon">
              <Icon name="wrench" size={16} />
            </span>
            <span className="sb-home-card__title">render_ui</span>
            <span className="sb-home-card__desc">
              JSX in, live widget out. Compile errors and unknown components
              come back as fixable tool errors with did-you-mean suggestions.
            </span>
          </div>
          <div className="sb-home-card" style={{ cursor: "default" }}>
            <span className="sb-home-card__icon">
              <Icon name="box" size={16} />
            </span>
            <span className="sb-home-card__title">list_components</span>
            <span className="sb-home-card__desc">
              The catalog, grouped — primitives, widgets, layout, chat chrome,
              icons — so Claude knows what it can build with.
            </span>
          </div>
          <div className="sb-home-card" style={{ cursor: "default" }}>
            <span className="sb-home-card__icon">
              <Icon name="eye" size={16} />
            </span>
            <span className="sb-home-card__title">get_component</span>
            <span className="sb-home-card__desc">
              Full TypeScript prop signatures on demand, generated from the
              kit's own <code>.d.ts</code> — docs that can't drift.
            </span>
          </div>
        </div>
      </section>

      <section className="sb-section" id="connect">
        <div className="sb-section__head">
          <span className="sb-section__title">Connect it</span>
          <span className="sb-section__note">claude.ai, Claude Desktop, or any MCP Apps host.</span>
        </div>
        <div className="sb-duo">
          <div>
            <div className="sb-section__note" style={{ display: "block", marginBottom: 8 }}>
              claude.ai — Settings → Connectors → Add custom connector:
            </div>
            <CodeBlock language="text">{`https://crail.jesh.dev/mcp`}</CodeBlock>
          </div>
          <div>
            <div className="sb-section__note" style={{ display: "block", marginBottom: 8 }}>
              Claude Desktop — <code>claude_desktop_config.json</code>:
            </div>
            <CodeBlock language="json">{`{
  "mcpServers": {
    "crail": { "command": "npx", "args": ["crail-mcp"] }
  }
}`}</CodeBlock>
          </div>
        </div>
      </section>

      <section className="sb-section">
        <div className="sb-section__head">
          <span className="sb-section__title">The kit underneath</span>
          <span className="sb-section__note">
            Everything Claude composes with, browsable — raw and in full
            rendered conversations.
          </span>
        </div>
        <div className="sb-home-cards" style={{ marginTop: 0 }}>
        <button className="sb-home-card" onClick={() => go("story/colors")}>
          <span className="sb-home-card__icon">
            <Icon name="box" size={16} />
          </span>
          <span className="sb-home-card__title">Foundations</span>
          <span className="sb-home-card__desc">
            Color tokens, the three type voices, and the icon set — light and
            dark from one palette.
          </span>
          <span className="sb-home-card__count">{counts["Foundations"]} pages</span>
        </button>
        <button className="sb-home-card" onClick={() => go("story/buttons")}>
          <span className="sb-home-card__icon">
            <Icon name="sliders" size={16} />
          </span>
          <span className="sb-home-card__title">Primitives</span>
          <span className="sb-home-card__desc">
            Buttons through modals — the quiet parts every tool UI is built
            from.
          </span>
          <span className="sb-home-card__count">{counts["Primitives"]} pages</span>
        </button>
        <button className="sb-home-card" onClick={() => go("story/messages")}>
          <span className="sb-home-card__icon">
            <Icon name="spark" size={16} />
          </span>
          <span className="sb-home-card__title">Chat chrome</span>
          <span className="sb-home-card__desc">
            Messages, thinking blocks, tool-call seams, code, and the composer.
          </span>
          <span className="sb-home-card__count">{counts["Chat"]} pages</span>
        </button>
        <button className="sb-home-card" onClick={() => go("story/collapsible")}>
          <span className="sb-home-card__icon">
            <Icon name="columns" size={16} />
          </span>
          <span className="sb-home-card__title">Layout</span>
          <span className="sb-home-card__desc">
            Collapsible views, split panes, sheets, and full-screen takeovers —
            all live, not mockups.
          </span>
          <span className="sb-home-card__count">{counts["Layout"]} pages</span>
        </button>
        <button className="sb-home-card" onClick={() => go("story/stats")}>
          <span className="sb-home-card__icon">
            <Icon name="wrench" size={16} />
          </span>
          <span className="sb-home-card__title">Tool widgets</span>
          <span className="sb-home-card__desc">
            Tables, charts, approvals, diffs, logs — what tool results deserve
            instead of JSON.
          </span>
          <span className="sb-home-card__count">{counts["Tool widgets"]} pages</span>
        </button>
        </div>
      </section>

      <section className="sb-section">
        <div className="sb-section__head">
          <span className="sb-section__title">Rendered conversations</span>
          <span className="sb-section__note">
            Every scenario is built only from kit components — flip on Inspect
            to see the seams.
          </span>
        </div>
        <div className="sb-home-cards" style={{ marginTop: 0 }}>
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              className="sb-home-card"
              onClick={() => go(`scenario/${sc.id}`)}
            >
              <span className="sb-home-card__icon">
                <Icon name="play" size={15} />
              </span>
              <span className="sb-home-card__title">{sc.nav}</span>
              <span className="sb-home-card__desc">{sc.title}</span>
              <span className="sb-home-card__count">full chat</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── App shell ───────────────────────────────────────────────── */

export default function App() {
  const [route, go] = useRoute();
  const [theme, chooseTheme] = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const [kind, param] = route.split("/");
  const activeStory = kind === "story" ? STORIES.find((s) => s.id === param) : undefined;
  const activeScenario =
    kind === "scenario" ? SCENARIOS.find((s) => s.id === param) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
  }, [route]);

  // Lock page scroll and allow Escape while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const page = activeStory ? (
    <StoryPage story={activeStory} />
  ) : activeScenario ? (
    <ScenarioPage scenario={activeScenario} />
  ) : (
    <HomePage go={go} />
  );

  return (
    <div className="sb-app mcp-root">
      {/* Mobile top bar */}
      <header className="sb-mobilebar">
        <button
          className="sb-mobilebar__menu"
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Icon name="menu" size={18} />
        </button>
        <Brand onClick={() => go("home")} />
        <span style={{ marginLeft: "auto" }}>
          <ThemeToggle theme={theme} onChoose={chooseTheme} />
        </span>
      </header>

      {/* Mobile drawer */}
      <div
        className={`sb-scrim ${menuOpen ? "sb-scrim--open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <nav
        className={`sb-drawer ${menuOpen ? "sb-drawer--open" : ""}`}
        aria-label="Navigation"
        aria-hidden={!menuOpen}
      >
        <div className="sb-drawer__head">
          <Brand onClick={() => go("home")} />
          <button
            className="sb-mobilebar__menu"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          >
            <Icon name="x" size={17} />
          </button>
        </div>
        <NavSections activeStory={activeStory} activeScenario={activeScenario} onGo={go} />
        <div className="sb-side__foot">
          <GitHubLink />
          <span className="sb-version">v0.2.0</span>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="sb-side">
        <div className="sb-brandrow">
          <Brand onClick={() => go("home")} />
          <ThemeToggle theme={theme} onChoose={chooseTheme} />
        </div>
        <NavSections activeStory={activeStory} activeScenario={activeScenario} onGo={go} />
        <div className="sb-side__foot">
          <GitHubLink />
          <span className="sb-version">v0.2.0</span>
        </div>
      </aside>

      <main className="sb-main">{page}</main>
    </div>
  );
}
