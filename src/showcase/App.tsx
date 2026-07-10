import { useEffect, useMemo, useState } from "react";
import { Icon, Segmented, type IconName } from "../kit";
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

const GROUP_ORDER = ["Foundations", "Primitives", "Chat", "Layout", "Tool widgets"];
const GROUP_ICONS: Record<string, IconName> = {
  Foundations: "box",
  Primitives: "sliders",
  Chat: "spark",
  Layout: "columns",
  "Tool widgets": "wrench",
};

function ThemePicker({
  theme,
  onChoose,
}: {
  theme: "light" | "dark";
  onChoose: (t: "light" | "dark") => void;
}) {
  return (
    <Segmented
      options={[
        { label: "Light", icon: "sun" },
        { label: "Dark", icon: "moon" },
      ]}
      active={theme === "light" ? 0 : 1}
      onChange={(i) => onChoose(i === 0 ? "light" : "dark")}
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
        <div className="sb-brand__sub">MCP UI kit · showcase</div>
      </span>
    </button>
  );
}

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

  return (
    <>
      {[...grouped.entries()].map(([group, stories]) => (
        <div key={group}>
          <div className="sb-nav-group">{group}</div>
          {stories.map((s) => (
            <button
              key={s.id}
              className={`sb-nav-item ${
                activeStory?.id === s.id ? "sb-nav-item--active" : ""
              }`}
              onClick={() => onGo(`story/${s.id}`)}
            >
              <Icon name={GROUP_ICONS[group]} size={13} />
              {s.nav}
            </button>
          ))}
        </div>
      ))}
      <div>
        <div className="sb-nav-group">Scenarios</div>
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

function HomePage({ go }: { go: (r: string) => void }) {
  const counts = useMemo(() => {
    const byGroup: Record<string, number> = {};
    for (const s of STORIES) byGroup[s.group] = (byGroup[s.group] ?? 0) + 1;
    return byGroup;
  }, []);
  return (
    <div>
      <div className="sb-hero">
        <span className="sb-eyebrow">Crail · MCP UI kit</span>
        <h1 className="sb-hero__title">
          Tools that feel <em>native</em> to the assistant they live in.
        </h1>
        <p className="sb-lede" style={{ maxWidth: 660 }}>
          Most MCP tools bolt a foreign interface onto a conversation. Crail
          takes the opposite view: match the host's design language — warm
          paper, one quiet grotesque, one terracotta accent — so a tool result reads
          as part of the reply, not an ad inside it. Primitives, chat chrome,
          and tool widgets, themed by CSS tokens, shown here both raw and inside
          full rendered conversations.
        </p>
        <div className="sb-hero__actions">
          <InstallLine />
          <a className="sb-gh-btn" href={GITHUB_URL} target="_blank" rel="noreferrer">
            <GitHubMark />
            View on GitHub
          </a>
        </div>
      </div>

      <div className="sb-home-cards">
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
        <div className="sb-theme-box">
          <span className="sb-theme-box__label">Appearance</span>
          <ThemePicker theme={theme} onChoose={chooseTheme} />
        </div>
        <NavSections activeStory={activeStory} activeScenario={activeScenario} onGo={go} />
        <div className="sb-side__foot">
          <GitHubLink />
          <span className="sb-version">v0.1.0</span>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="sb-side">
        <Brand onClick={() => go("home")} />
        <div className="sb-theme-box">
          <span className="sb-theme-box__label">Appearance</span>
          <ThemePicker theme={theme} onChoose={chooseTheme} />
        </div>
        <NavSections activeStory={activeStory} activeScenario={activeScenario} onGo={go} />
        <div className="sb-side__foot">
          <GitHubLink />
          <span className="sb-version">v0.1.0</span>
        </div>
      </aside>

      <main className="sb-main">{page}</main>
    </div>
  );
}
